import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';

interface Product {
  id: number;
  name: string;
  imageUrl: string;
}

interface ProductCarouselProps {
  products: Product[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const itemsPerPage = 3;

  if (!products || products.length === 0) {
    return (
      <p className="py-10 text-center text-gray-500" role="status">
        Produk unggulan tidak ditemukan.
      </p>
    );
  }

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const showNavigation = products.length > itemsPerPage;

  const goToPreviousPage = useCallback(() => {
    setDirection(-1);
    setPage((prevPage) => (prevPage === 0 ? totalPages - 1 : prevPage - 1));
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    setDirection(1);
    setPage((prevPage) => (prevPage === totalPages - 1 ? 0 : prevPage + 1));
  }, [totalPages]);

  useEffect(() => {
    if (!showNavigation) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPreviousPage();
      if (e.key === 'ArrowRight') goToNextPage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showNavigation, goToPreviousPage, goToNextPage]);

  const startIndex = page * itemsPerPage;
  const visibleProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -50 : 50,
      opacity: 0,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <div
      className="relative flex w-full items-center"
      role="region"
      aria-roledescription="carousel"
      aria-label="Produk unggulan"
    >
      {showNavigation && (
        <button
          type="button"
          onClick={goToPreviousPage}
          className="absolute left-0 z-10 -translate-x-1/2 rounded-full bg-white/80 p-2 shadow-lg transition-all duration-300 ease-in-out hover:bg-white active:scale-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Halaman produk sebelumnya"
          aria-controls="carousel-items"
        >
          <ChevronLeftIcon className="h-6 w-6 text-gray-900" aria-hidden="true" />
        </button>
      )}

      <div
        id="carousel-items"
        className="w-full overflow-hidden px-1 py-1"
        aria-live="polite"
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {visibleProducts.map((product, idx) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group block"
                aria-label={`Lihat detail produk ${product.name}`}
              >
                <figure className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100 shadow-md">
                  <div className="relative h-80 w-full">
                    <img
                      src={product.imageUrl}
                      alt={`Produk ${product.name}`}
                      width={500}
                      height={500}
                      className="h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                      loading={page === 0 && idx < itemsPerPage ? 'eager' : 'lazy'}
                      decoding="async"
                      fetchPriority={page === 0 ? 'high' : 'auto'}
                    />
                  </div>
                  <figcaption className="sr-only">{product.name}</figcaption>
                </figure>
              </Link>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {showNavigation && (
        <button
          type="button"
          onClick={goToNextPage}
          className="absolute right-0 z-10 translate-x-1/2 rounded-full bg-white/80 p-2 shadow-lg transition-all duration-300 ease-in-out hover:bg-white active:scale-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Halaman produk selanjutnya"
          aria-controls="carousel-items"
        >
          <ChevronRightIcon className="h-6 w-6 text-gray-900" aria-hidden="true" />
        </button>
      )}

      {showNavigation && (
        <div
          className="mt-6 flex w-full items-center justify-center gap-2"
          role="tablist"
          aria-label="Indikator halaman produk"
        >
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={page === idx}
              aria-label={`Halaman ${idx + 1} dari ${totalPages}`}
              onClick={() => {
                setDirection(idx > page ? 1 : -1);
                setPage(idx);
              }}
              className={`h-2 w-8 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                page === idx ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}