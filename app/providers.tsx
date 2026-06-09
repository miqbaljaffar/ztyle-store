'use client';

import { SessionProvider } from 'next-auth/react';
import { LazyMotion, domAnimation } from 'framer-motion';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </SessionProvider>
  );
}