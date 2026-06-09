import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ message: 'Token tidak ditemukan.' }, { status: 400 });
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ message: 'Kode OTP tidak valid.' }, { status: 400 });
    }

    const hasExpired = new Date(verificationToken.expires) < new Date();

    if (hasExpired) {
      return NextResponse.json({ message: 'Kode OTP sudah kedaluwarsa.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan.' }, { status: 404 });
    }

    // Update status verifikasi user
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Hapus token setelah berhasil digunakan
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    return NextResponse.json({ message: 'Verifikasi email berhasil!' }, { status: 200 });

  } catch (error) {
    console.error("Gagal verifikasi email:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}