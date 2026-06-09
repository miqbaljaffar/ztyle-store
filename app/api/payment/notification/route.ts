import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Webhook handler untuk notifikasi pembayaran dari Midtrans.
 *
 * Midtrans mengirimkan POST request ke endpoint ini setiap kali
 * status transaksi berubah (berhasil, pending, gagal, expired).
 *
 * PENTING: Endpoint ini TIDAK memerlukan autentikasi session karena
 * dipanggil oleh Midtrans server, bukan oleh user. Keamanan dijamin
 * melalui verifikasi signature_key.
 *
 * Setup di Midtrans Dashboard:
 * Settings → Configuration → Payment Notification URL:
 * https://yourdomain.com/api/payment/notification
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    // ─── Verifikasi Signature Key ─────────────────────────────────────────────
    // Format: SHA512(order_id + status_code + gross_amount + ServerKey)
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex');

    if (signature_key !== expectedSignature) {
      console.warn('[Midtrans Webhook] Invalid signature for order:', order_id);
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    // ─── Cari order berdasarkan midtransOrderId ───────────────────────────────
    const order = await prisma.order.findUnique({
      where: { midtransOrderId: order_id },
      include: { items: true },
    });

    if (!order) {
      console.warn('[Midtrans Webhook] Order tidak ditemukan:', order_id);
      // Kembalikan 200 agar Midtrans tidak retry — order mungkin sudah dihapus
      return NextResponse.json({ message: 'Order tidak ditemukan' }, { status: 200 });
    }

    // ─── Map status Midtrans → status Ztyle ──────────────────────────────────
    let newStatus: string | null = null;

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      // Pembayaran berhasil
      if (fraud_status === 'accept' || !fraud_status) {
        newStatus = 'PAID';
      }
    } else if (transaction_status === 'pending') {
      // Masih menunggu pembayaran — tidak perlu update
      newStatus = null;
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire'
    ) {
      // Pembayaran gagal/dibatalkan/kadaluarsa → kembalikan stok
      newStatus = 'CANCELLED';
    }

    if (newStatus === null) {
      return NextResponse.json({ message: 'Status tidak memerlukan update' }, { status: 200 });
    }

    // Jika sudah PAID atau CANCELLED sebelumnya, abaikan notifikasi duplikat
    if (order.status === newStatus) {
      return NextResponse.json({ message: 'Status sudah up-to-date' }, { status: 200 });
    }

    // ─── Update status order ──────────────────────────────────────────────────
    if (newStatus === 'CANCELLED' && order.status === 'PENDING') {
      // Kembalikan stok secara atomis menggunakan Prisma transaction
      await prisma.$transaction(async (tx) => {
        // Update status order
        await tx.order.update({
          where: { id: order.id },
          data: { status: newStatus as string },
        });

        // Kembalikan stok setiap item
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });
    } else {
      // Hanya update status
      await prisma.order.update({
        where: { id: order.id },
        data: { status: newStatus },
      });
    }

    console.log(`[Midtrans Webhook] Order #${order.id} status updated: ${order.status} → ${newStatus}`);
    return NextResponse.json({ message: 'OK' }, { status: 200 });

  } catch (error) {
    console.error('[Midtrans Webhook] Error:', error);
    // Kembalikan 200 agar Midtrans tidak retry terus-menerus
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 200 });
  }
}
