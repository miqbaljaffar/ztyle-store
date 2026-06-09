import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

// Definisikan tipe data untuk item di keranjang dan state store
interface CartItem {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, newQuantity: number) => void;
  clearCart: () => void;
}

// Buat store Zustand
export const useCartStore = create<CartState>()(
  // Gunakan middleware 'persist' untuk menyimpan state keranjang di localStorage
  // Ini memastikan keranjang tidak kosong saat pengguna me-refresh halaman
  persist(
    (set, get) => ({
      items: [],

      // Aksi untuk menambahkan item ke keranjang
      addToCart: (product) => {
        const cart = get().items;
        const existingItem = cart.find(item => item.id === product.id);
        const quantityToAdd = product.quantity || 1;

        if (existingItem) {
          // Jika item sudah ada, cukup tambahkan kuantitasnya
          set(state => ({
            items: state.items.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantityToAdd }
                : item
            ),
          }));
          toast.success(`${product.name} ditambahkan ke keranjang!`);
        } else {
          // Jika item baru, tambahkan ke dalam array
          set(state => ({
            items: [...state.items, { ...product, quantity: quantityToAdd }],
          }));
          toast.success(`${product.name} berhasil ditambahkan!`);
        }
      },

      // Aksi untuk menghapus item dari keranjang
      removeFromCart: (productId) => {
        set(state => ({
          items: state.items.filter(item => item.id !== productId),
        }));
      },

      // Aksi untuk memperbarui kuantitas item
      updateQuantity: (productId, newQuantity) => {
        if (newQuantity > 0) {
          set(state => ({
            items: state.items.map(item =>
              item.id === productId ? { ...item, quantity: newQuantity } : item
            ),
          }));
        } else {
          // Jika kuantitas menjadi 0 atau kurang, hapus item
          get().removeFromCart(productId);
        }
      },
      
      // Aksi untuk mengosongkan keranjang (berguna setelah checkout)
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage', // Nama key di localStorage
    }
  )
);