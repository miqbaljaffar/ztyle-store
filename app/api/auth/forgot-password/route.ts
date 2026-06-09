import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/mail';

async function createAndSendPasswordResetToken(email: string) {
    // 1. Buat token OTP 6 digit yang unik
    const token = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expires = new Date(new Date().getTime() + 3600 * 1000); // Token berlaku selama 1 jam

    // Hapus token reset password lama jika ada, lalu buat token baru
    await prisma.verificationToken.deleteMany({ where: { email } });
    
    await prisma.verificationToken.create({
        data: {
            email: email,
            token: token,
            expires: expires,
        },
    });

    // 2. Kirim email reset password
    await sendPasswordResetEmail(email, token);
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email diperlukan.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Jika user tidak ditemukan, atau jika user mendaftar via Google (tidak punya password)
    if (!user || !user.password) {
      // Kirim respons sukses generik untuk menghindari enumerasi email
      return NextResponse.json({ message: "Jika email Anda terdaftar, kami telah mengirimkan instruksi reset password." }, { status: 200 });
    }

    await createAndSendPasswordResetToken(email);

    return NextResponse.json({ message: "Jika email Anda terdaftar, kami telah mengirimkan instruksi reset password." }, { status: 200 });

  } catch (error) {
    console.error("Gagal saat proses lupa password:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}