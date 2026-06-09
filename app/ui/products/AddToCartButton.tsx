'use client'

import { useCartStore } from "@/app/store/cart";
import { toast } from "sonner";

// Definisikan tipe untuk properti produk yang dibutuhkan
interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

// Definisikan tipe untuk props komponen
interface AddToCartButtonProps {
  product: Product;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  disabled?: boolean;
  userRole?: string | null; 
}

export default function AddToCartButton({ product, className, style, children, disabled, userRole }: AddToCartButtonProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  const handleAddToCart = () => {
    // Tambahkan pengecekan peran (role) pengguna
    if (userRole === 'ADMIN') {
        toast.info("Admin tidak dapat menambahkan produk ke keranjang.");
        return;
    }

    if (disabled) {
      return;
    }
    
    addToCart(product); 
  };
  
  // Tombol akan nonaktif jika prop `disabled` bernilai true ATAU jika role pengguna adalah ADMIN
  const isButtonDisabled = disabled || userRole === 'ADMIN';

  return (
    <button onClick={handleAddToCart} className={className} style={style} disabled={isButtonDisabled}>
      {children}
    </button>
  );
}