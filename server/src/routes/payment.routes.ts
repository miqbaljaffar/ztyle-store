import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { put } from '@vercel/blob';

import prisma from '../lib/prisma';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ─── POST /api/payment/notification (Midtrans webhook) ────────
router.post('/notification', async (req: Request, res: Response) => {
  try {
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = req.body;

    // Verifikasi signature Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY ?? '';
    const expected = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex');

    if (signature_key !== expected) {
      console.warn('[Midtrans Webhook] Invalid signature for order:', order_id);
      return res.status(403).json({ message: 'Invalid signature' });
    }

    const order = await prisma.order.findUnique({
      where: { midtransOrderId: order_id },
      include: { items: true },
    });

    if (!order) {
      console.warn('[Midtrans Webhook] Order tidak ditemukan:', order_id);
      return res.json({ message: 'Order tidak ditemukan' });
    }

    // Tentukan status baru berdasarkan Midtrans transaction_status
    let newStatus: string | null = null;
    if ((transaction_status === 'capture' || transaction_status === 'settlement') && (fraud_status === 'accept' || !fraud_status)) {
      newStatus = 'PAID';
    } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
      newStatus = 'CANCELLED';
    }

    if (newStatus === null || order.status === newStatus) {
      return res.json({ message: 'Status tidak memerlukan update' });
    }

    // Jika dibatalkan dari PENDING, kembalikan stok
    if (newStatus === 'CANCELLED' && order.status === 'PENDING') {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: order.id }, data: { status: newStatus as string } });
        for (const item of order.items) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
      });
    } else {
      await prisma.order.update({ where: { id: order.id }, data: { status: newStatus } });
    }

    console.log(`[Midtrans Webhook] Order #${order.id}: ${order.status} → ${newStatus}`);
    return res.json({ message: 'OK' });
  } catch (error) {
    console.error('[Midtrans Webhook] Error:', error);
    return res.json({ message: 'Internal Server Error' });
  }
});

// ─── GET /api/payment/snap-token/:orderId ─────────────────────
router.get('/snap-token/:orderId', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const orderId = parseInt(req.params.orderId, 10);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true, snapToken: true, totalAmount: true },
    });

    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    return res.json({ snapToken: order.snapToken, status: order.status, totalAmount: order.totalAmount });
  } catch (error) {
    console.error('[snap-token]', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ─── POST /api/upload ─────────────────────────────────────────
router.post('/upload', authenticateJWT, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah.' });
  }

  try {
    const blob = await put(req.file.originalname, req.file.buffer, {
      access: 'public',
      addRandomSuffix: true,
    });

    console.log(`[upload] File uploaded: ${blob.url}`);
    return res.json({ success: true, url: blob.url });
  } catch (error) {
    console.error('[upload] Gagal upload ke Vercel Blob:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses file di server.' });
  }
});

export default router;
