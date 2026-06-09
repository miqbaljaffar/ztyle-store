import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { TagIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Category {
  id: number;
  name: string;
}

export default function DashboardCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data?.categories || data || []);
    } catch (error) {
      toast.error('Gagal mengambil data kategori.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error('Nama kategori tidak boleh kosong.');
      return;
    }
    const url = editingCategoryId ? `/api/categories/${editingCategoryId}` : '/api/categories';
    const method = editingCategoryId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan kategori.');

      toast.success(editingCategoryId ? 'Kategori berhasil diperbarui!' : 'Kategori berhasil ditambahkan!');
      setCategoryName('');
      setEditingCategoryId(null);
      fetchCategories();
    } catch (error) {
      toast.error('Gagal menyimpan kategori.');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = window.confirm('Apakah Anda yakin ingin menghapus kategori ini? Aksi ini bisa gagal jika ada produk yang terkait.');
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal menghapus kategori.');
      }
      toast.success('Kategori berhasil dihapus.');
      fetchCategories();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Gagal menghapus kategori.');
    }
  };

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Manajemen Kategori</h1>
        <p className="text-gray-500 mt-1 text-sm">Tambah, edit, atau hapus kategori produk.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <TagIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder={editingCategoryId ? 'Edit nama kategori...' : 'Nama kategori baru...'}
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {editingCategoryId && (
              <button
                type="button"
                onClick={() => {
                  setEditingCategoryId(null);
                  setCategoryName('');
                }}
                className="py-3 px-5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors w-full md:w-auto text-center"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-1.5 w-full md:w-auto"
            >
              <PlusIcon className="w-5 h-5 md:hidden" />
              <span>{editingCategoryId ? 'Update Kategori' : 'Simpan Kategori'}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th scope="col" className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">ID</th>
                <th scope="col" className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Nama Kategori</th>
                <th scope="col" className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-blue-600">#{cat.id}</td>
                  <td className="px-6 py-4 text-gray-900 font-semibold">{cat.name}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-2 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Edit Kategori"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title="Hapus Kategori"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categories.length === 0 && !isLoading && (
            <p className="text-center text-gray-500 py-10 text-sm">Belum ada kategori yang ditambahkan.</p>
          )}
        </div>
      </div>
    </div>
  );
}
