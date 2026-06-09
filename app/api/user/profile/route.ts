import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';


// Skema validasi untuk data profil yang masuk
const profileSchema = z.object({
  name: z.string().min(3, "Nama harus memiliki setidaknya 3 karakter.").max(50),
  phoneNumber: z.string().max(15).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
});

// Handler untuk mengambil data profil pengguna saat ini
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        address: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}


// Handler untuk mengupdate data profil pengguna
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // 1. Validasi menggunakan Zod langsung (React otomatis melakukan auto-escape terhadap output string saat dirender)
    const validatedData = profileSchema.parse(body);

    // 3. Update data di database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedData.name,
        phoneNumber: validatedData.phoneNumber,
        address: validatedData.address,
      },
    });
    
    // Jangan kirim password dalam response
    const { password, ...result } = updatedUser;

    return NextResponse.json(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Input tidak valid", errors: error.errors }, { status: 400 });
    }
    console.error("Failed to update profile:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}