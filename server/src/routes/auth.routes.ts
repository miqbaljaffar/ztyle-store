import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { hash, compare } from 'bcrypt';

import prisma from '../lib/prisma';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/mail';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { userRegisterSchema, loginSchema, resetPasswordSchema } from '../schemas';
import { z } from 'zod';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET ?? 'ztyle-dev-secret-do-not-use-in-prod';

// ─── HELPER ───────────────────────────────────────────────────

async function createAndSendToken(email: string) {
  const token = crypto.randomBytes(3).toString('hex').toUpperCase();
  const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

  await prisma.verificationToken.deleteMany({ where: { email } });
  await prisma.verificationToken.create({ data: { email, token, expires } });
  await sendVerificationEmail(email, token);
}

async function createAndSendPasswordResetToken(email: string) {
  const token = crypto.randomBytes(3).toString('hex').toUpperCase();
  const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

  await prisma.verificationToken.deleteMany({ where: { email } });
  await prisma.verificationToken.create({ data: { email, token, expires } });
  await sendPasswordResetEmail(email, token);
}

// ─── POST /api/auth/register ───────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = userRegisterSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      if (!existing.emailVerified) {
        await createAndSendToken(data.email);
        return res.json({ message: "Email sudah terdaftar tapi belum diverifikasi. Kami telah mengirim ulang kode OTP." });
      }
      return res.status(409).json({ message: "Email sudah terdaftar dan terverifikasi." });
    }

    const hashedPassword = await hash(data.password, 10);
    await prisma.user.create({
      data: { name: data.name, email: data.email, password: hashedPassword, emailVerified: null },
    });

    await createAndSendToken(data.email);
    return res.status(201).json({ message: "Registrasi berhasil! Silakan cek email Anda untuk kode verifikasi." });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    console.error("[auth/register]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── POST /api/auth/verify-email ──────────────────────────────
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token tidak ditemukan.' });

    const vt = await prisma.verificationToken.findUnique({ where: { token } });
    if (!vt) return res.status(400).json({ message: 'Kode OTP tidak valid.' });
    if (new Date(vt.expires) < new Date()) return res.status(400).json({ message: 'Kode OTP sudah kedaluwarsa.' });

    const user = await prisma.user.findUnique({ where: { email: vt.email } });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });

    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
    await prisma.verificationToken.delete({ where: { id: vt.id } });

    return res.json({ message: 'Verifikasi email berhasil!' });
  } catch (error) {
    console.error("[auth/verify-email]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return res.status(401).json({ message: 'Email atau password salah.' });
    if (!user.emailVerified) return res.status(403).json({ message: 'Email belum diverifikasi. Silakan cek email Anda.' });

    const valid = await compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Email atau password salah.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image, phoneNumber: user.phoneNumber, address: user.address },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    console.error("[auth/login]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  return res.json({ message: 'Logout berhasil' });
});

// ─── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phoneNumber: true, address: true, role: true, image: true },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    console.error("[auth/me]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email diperlukan.' });

    const user = await prisma.user.findUnique({ where: { email } });
    // Selalu return pesan yang sama agar tidak bocorkan info email terdaftar
    if (user?.password) await createAndSendPasswordResetToken(email);

    return res.json({ message: "Jika email Anda terdaftar, kami telah mengirimkan instruksi reset password." });
  } catch (error) {
    console.error("[auth/forgot-password]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── POST /api/auth/reset-password ───────────────────────────
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    const vt = await prisma.verificationToken.findUnique({ where: { token } });
    if (!vt) return res.status(400).json({ message: 'Kode OTP tidak valid.' });
    if (new Date(vt.expires) < new Date()) return res.status(400).json({ message: 'Kode OTP sudah kedaluwarsa.' });

    const user = await prisma.user.findUnique({ where: { email: vt.email } });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });

    const hashedPassword = await hash(password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
    await prisma.verificationToken.delete({ where: { id: vt.id } });

    return res.json({ message: 'Password berhasil direset! Anda akan diarahkan ke halaman login.' });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    console.error("[auth/reset-password]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
