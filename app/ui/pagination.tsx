'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      const params = new URLSearchParams(searchParams);
      params.set('page', page.toString());
      // Untuk dashboard, kita cukup refresh dengan query param baru
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center space-x-4 mt-12 py-4">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-disabled={currentPage === 1}
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Previous</span>
      </button>

      <span className="text-sm font-medium">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-disabled={currentPage === totalPages}
      >
        <span>Next</span>
        <ArrowRightIcon className="w-5 h-5" />
      </button>
    </div>
  );
}