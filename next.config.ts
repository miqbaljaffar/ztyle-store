import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ['@prisma/client', 'bcrypt', 'midtrans-client'],
};

export default nextConfig;
