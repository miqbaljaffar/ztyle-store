import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcrypt';
import { z } from 'zod';

import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/mail';

// Skema validasi menggunakan Zod
const userSchema = z.object({
  name: z.string().min(3, "Nama harus lebih dari 3 karakter."),
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(6, "Password minimal harus 6 karakter."),
});

// Fungsi untuk membuat dan mengirim token verifikasi
async function createAndSendToken(email: string) {
    // 1. Buat token OTP 6 digit yang unik
    const token = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expires = new Date(new Date().getTime() + 3600 * 1000); // Token berlaku selama 1 jam

    // Hapus token lama jika ada, lalu buat token baru
    await prisma.verificationToken.deleteMany({ where: { email } });
    
    // Pastikan bagian ini sesuai dengan skema
    await prisma.verificationToken.create({
        data: {
            email: email,
            token: token,
            expires: expires,
        },
    });

    // 2. Kirim email verifikasi
    await sendVerificationEmail(email, token);
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = userSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    // Jika user sudah ada
    if (existingUser) {
      // Dan user tersebut belum memverifikasi emailnya
      if (!existingUser.emailVerified) {
        // Kirim ulang email verifikasi
        await createAndSendToken(validatedData.email);
        return NextResponse.json({ message: "Email sudah terdaftar tapi belum diverifikasi. Kami telah mengirim ulang kode OTP." }, { status: 200 });
      }
      // Jika sudah terverifikasi, kirim error
      return NextResponse.json({ message: "Email sudah terdaftar dan terverifikasi." }, { status: 409 });
    }

    // Jika user belum ada, buat user baru
    const hashedPassword = await hash(validatedData.password, 10);
    await prisma.user.create({
        data: {
            name: validatedData.name,
            email: validatedData.email,
            password: hashedPassword,
            emailVerified: null, // Tandai sebagai belum terverifikasi
        }
    });

    // Buat dan kirim token verifikasi untuk user baru
    await createAndSendToken(validatedData.email);

    return NextResponse.json({ message: "Registrasi berhasil! Silakan cek email Anda untuk kode verifikasi." }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Input tidak valid", errors: error.errors }, { status: 400 });
    }
    console.error("Gagal saat registrasi:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}