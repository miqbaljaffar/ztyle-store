import { PrismaClient } from '@prisma/client';

// Singleton pattern: mencegah connection pool exhaustion di lingkungan serverless.
// Instance disimpan di `globalThis` sehingga di-reuse antar warm function invocations.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
