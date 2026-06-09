import 'next-auth/jwt';
import { DefaultSession } from 'next-auth';

// Mendefinisikan ulang modul untuk menambahkan properti kustom
declare module 'next-auth' {
  /**
   * Tipe User diperbarui untuk mencocokkan skema Prisma Anda.
   */
  interface User {
    id: number;
    role?: string;
    phoneNumber?: string | null;
    address?: string | null;
  }

  /**
   * Tipe Session diperbarui untuk menyertakan properti baru.
   */
  interface Session extends DefaultSession {
    user?: {
      id: number;
      role?: string;
      phoneNumber?: string | null;
      address?: string | null;
    } & DefaultSession['user'];
  }
}

// Mendefinisikan ulang token JWT untuk menyertakan properti kustom
declare module 'next-auth/jwt' {
  /** Token diperbarui untuk membawa data tambahan */
  interface JWT {
    id: number;
    role?: string;
    phoneNumber?: string | null;
    address?: string | null;
  }
}