import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcrypt';
import { z } from 'zod';

const resetSchema = z.object({
  token: z.string().min(1, "Token diperlukan."),
  password: z.string().min(6, "Password minimal harus 6 karakter."),
  confirmPassword: z.string().min(6, "Konfirmasi password minimal harus 6 karakter."),
}).refine(data => data.password === data.password, {
  message: "Password dan konfirmasi password tidak cocok.",
  path: ["confirmPassword"], 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = resetSchema.parse(body);
    
    const { token, password } = validatedData;

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

    // Hash password baru
    const hashedPassword = await hash(password, 10);

    // Update password user
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Hapus token setelah berhasil digunakan
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    return NextResponse.json({ message: 'Password berhasil direset! Anda akan diarahkan ke halaman login.' }, { status: 200 });

  } catch (error) {
     if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Input tidak valid", errors: error.errors }, { status: 400 });
    }
    console.error("Gagal reset password:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}