'use client'

import { useRouter } from "next/navigation";
import { useCartStore } from "@/app/store/cart"; 
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// Definisikan tipe untuk properti produk yang dibutuhkan
interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

// Definisikan tipe untuk props komponen
interface BuyNowButtonProps {
  product: Product;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  disabled?: boolean;
  userRole?: string; 
}

export default function BuyNowButton({ product, className, style, children, disabled, userRole }: BuyNowButtonProps) {
  const router = useRouter();
  const { status } = useSession();
  
  const addToCart = useCartStore((state) => state.addToCart); 

  const handleBuyNow = () => {
    // Tambahkan pengecekan role di awal
    if (userRole === 'ADMIN') {
        toast.info("Admin tidak dapat membeli produk.");
        return;
    }

    if (disabled) {
        toast.error('Stok produk ini sudah habis.');
        return;
    }
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    addToCart(product);
    
    router.push('/checkout');
  };

  // Logika disable: disable jika prop `disabled` true ATAU jika role adalah ADMIN
  const isButtonDisabled = disabled || userRole === 'ADMIN';

  return (
    <button onClick={handleBuyNow} className={className} style={style} disabled={isButtonDisabled}>
      {children}
    </button>
  );
}