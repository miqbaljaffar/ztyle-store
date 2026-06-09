import { useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/cart"; 
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

interface BuyNowButtonProps {
  product: Product;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  disabled?: boolean;
  userRole?: string; 
}

export default function BuyNowButton({ product, className, style, children, disabled, userRole }: BuyNowButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const addToCart = useCartStore((state: any) => state.addToCart); 

  const handleBuyNow = () => {
    if (userRole === 'ADMIN') {
        toast.info("Admin tidak dapat membeli produk.");
        return;
    }

    if (disabled) {
        toast.error('Stok produk ini sudah habis.');
        return;
    }
    
    if (!user) {
      navigate('/login');
      return;
    }

    addToCart(product);
    navigate('/checkout');
  };

  const isButtonDisabled = disabled || userRole === 'ADMIN';

  return (
    <button onClick={handleBuyNow} className={className} style={style} disabled={isButtonDisabled}>
      {children}
    </button>
  );
}