'use client'; 

import Link from 'next/link';
import NavLinks from '@/app/(admin)/dashboard/ui/nav-links';
import { PowerIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner'; 

export default function SideNav() {
  
  // 2. Buat fungsi handle untuk logout
  const handleSignOut = () => {
    toast.success('Anda telah berhasil logout.');
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <Link
        className="mb-2 flex h-20 items-center justify-center rounded-md p-4 md:h-40"
        href="/dashboard"
      >
        <div className="w-32 text-white md:w-40">
           <Image src="/Logo.png" alt="Ztyle Logo" width={120} height={45} priority />
        </div>
      </Link>
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
        
        {/* 3. Panggil fungsi handleSignOut saat tombol diklik */}
        <button 
          onClick={handleSignOut}
          className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3"
        >
          <PowerIcon className="w-6" />
          <div className="hidden md:block">Sign Out</div>
        </button>

      </div>
    </div>
  );
}