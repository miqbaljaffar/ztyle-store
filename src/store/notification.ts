import { create } from 'zustand';

// Definisikan tipe state dan actions
interface NotificationState {
  pendingCount: number;
  fetchPendingCount: () => Promise<void>;
  decrementCount: () => void;
}

// Buat store Zustand
export const useNotificationStore = create<NotificationState>((set) => ({
  pendingCount: 0, // Nilai awal

  // Aksi untuk mengambil data awal dari API
  fetchPendingCount: async () => {
    try {
      const res = await fetch('/api/orders/pending-count');
      if (res.ok) {
        const data = await res.json();
        set({ pendingCount: data.count });
      }
    } catch (error) {
      console.error('Gagal mengambil data notifikasi:', error);
    }
  },

  // Aksi untuk mengurangi jumlah notifikasi secara manual
  decrementCount: () => {
    set((state) => ({ pendingCount: Math.max(0, state.pendingCount - 1) }));
  },
}));