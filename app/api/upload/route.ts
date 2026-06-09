// app/api/upload/route.ts

import { put } from '@vercel/blob';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'Tidak ada file yang diunggah.' }, { status: 400 });
  }

  try {
    // Unggah file ke Vercel Blob
    const blob = await put(
      // Nama file yang akan disimpan
      file.name,
      // Konten file
      file,
      // Opsi untuk membuat file dapat diakses secara publik
      {
        access: 'public',
        // Tambahkan suffix acak untuk menghindari penimpaan file dengan nama yang sama
        addRandomSuffix: true,
      }
    );

    // Ambil URL dari hasil unggahan
    const { url } = blob;

    console.log(`File berhasil diunggah ke Vercel Blob. URL: ${url}`);
    return NextResponse.json({ success: true, url: url });

  } catch (error) {
    console.error("Gagal mengunggah ke Vercel Blob:", error);
    return NextResponse.json({ success: false, message: 'Gagal memproses file di server.' }, { status: 500 });
  }
}