'use client'

import { useState, useEffect, FormEvent } from 'react';
import { toast } from 'sonner';
import { TagIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';


interface Category {
  id: number;
  name: string;
}

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data?.categories || []);
    } catch (error) {
      toast.error("Gagal mengambil data kategori.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!categoryName) {
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
    toast('Apakah Anda yakin ingin menghapus kategori ini?', {
      description: 'Aksi ini bisa gagal jika ada produk yang terkait dengan kategori ini.',
      action: {
        label: 'Hapus',
        onClick: async () => {
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
              toast.error(error.message);
            }
        },
      },
      cancel: {
        label: 'Batal',
        onClick: () => {}, 
      },
    });
  };
  
  if (isLoading) {
    return <p>Memuat data kategori...</p>;
  }

  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold text-gray-800">Manajemen Kategori</h1>
        <p className="text-gray-500 mt-1">Tambah, edit, atau hapus kategori produk.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <TagIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
            <input 
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder={editingCategoryId ? "Edit nama kategori..." : "Nama kategori baru..."}
              required
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            {editingCategoryId && (
              <button type="button" onClick={() => { setEditingCategoryId(null); setCategoryName(''); }} className="btn bg-gray-200 text-gray-800 hover:bg-gray-300 w-full justify-center">
                Batal
              </button>
            )}
            <button type="submit" className="btn w-full justify-center">
              <PlusIcon className="w-5 h-5 md:hidden" />
              <span className="hidden md:inline">{editingCategoryId ? 'Update Kategori' : 'Simpan Kategori'}</span>
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="tracking-wider border-b-2 border-gray-200 bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold text-gray-600">ID</th>
                <th scope="col" className="px-6 py-4 font-semibold text-gray-600">Nama Kategori</th>
                <th scope="col" className="px-6 py-4 font-semibold text-gray-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-blue-600">#{cat.id}</td>
                  <td className="px-6 py-4 text-gray-800">{cat.name}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(cat)} className="p-2 rounded-full hover:bg-blue-100" title="Edit Kategori">
                        <PencilIcon className="w-5 h-5 text-blue-600"/>
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-2 rounded-full hover:bg-red-100" title="Hapus Kategori">
                        <TrashIcon className="w-5 h-5 text-red-500"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           {categories.length === 0 && !isLoading && (
              <div className="text-center p-8 text-gray-500">
                  <p>Belum ada kategori yang ditambahkan.</p>
              </div>
           )}
        </div>
      </div>
      <style jsx>{`
        .input-field {
            display: block; width: 100%; border-radius: 0.5rem;
            border: 1px solid #D1D5DB; background-color: #F9FAFB;
            padding: 0.75rem; font-size: 0.875rem;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-field:focus {
            outline: none; border-color: #3B82F6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
        }
        .input-field.pl-10 {
            padding-left: 2.5rem;
        }
      `}</style>
    </div>
  );
}
