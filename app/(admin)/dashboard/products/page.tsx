'use client'

import { useState, useEffect, FormEvent, ChangeEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Pagination from '@/app/ui/pagination';
import { ProductsGridSkeleton } from '@/app/ui/skeletons';
import { toast } from 'sonner';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Toolbar } from '@/app/(admin)/dashboard/ui/Toolbar';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// Interface untuk data Product dan Category
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: { id: number; name: string; };
  imageUrl: string;
  description?: string;
  categoryId: number;
}

interface Category {
  id: number;
  name: string;
}

// Komponen Card Produk yang baru dan responsif
function ProductCard({ product, onEdit, onDelete }: { product: Product, onEdit: (product: Product) => void, onDelete: (id: number) => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="relative">
        <Image src={product.imageUrl} alt={product.name} width={400} height={250} className="w-full h-48 object-cover"/>
        <span className="absolute top-3 right-3 bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">{product.category?.name || 'N/A'}</span>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-800 truncate">{product.name}</h3>
        <p className="text-blue-600 font-semibold text-xl mt-1 mb-3">Rp{product.price.toLocaleString('id-ID')}</p>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Stok: <span className="font-medium text-gray-800">{product.stock}</span></span>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(product)} className="p-2 rounded-full hover:bg-gray-100 transition-colors" title="Edit Produk">
              <PencilIcon className="w-5 h-5 text-gray-600"/>
            </button>
            <button onClick={() => onDelete(product.id)} className="p-2 rounded-full hover:bg-red-100 transition-colors" title="Hapus Produk">
              <TrashIcon className="w-5 h-5 text-red-500"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Komponen utama dipisahkan untuk menggunakan Suspense
function ProductsManagementComponent() {
  const searchParams = useSearchParams();

  // State untuk data dan UI
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // State untuk paginasi
  const [totalPages, setTotalPages] = useState(0);
  const currentPage = Number(searchParams.get('page')) || 1;

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    categoryId: '',
    stock: '0',
    imageUrl: '/products/default.jpg',
    description: '',
  });

  // Inisialisasi editor TipTap
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: 'Tulis deskripsi lengkap produk di sini...',
      }),
    ],
    content: formData.description,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, description: editor.getHTML() }));
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none w-full input-field min-h-[150px] p-2',
      },
    },
    immediatelyRender: false,
  });

  // Sinkronisasi konten editor
  useEffect(() => {
    if (editor && editor.getHTML() !== formData.description) {
      editor.commands.setContent(formData.description);
    }
  }, [formData.description, editor]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`/api/products?page=${currentPage}`), 
          fetch('/api/categories')
        ]);
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        setProducts(productsData.products);
        setTotalPages(productsData.totalPages);
        setCategories(Array.isArray(categoriesData.categories) ? categoriesData.categories : (Array.isArray(categoriesData) ? categoriesData : []));
      } catch (error) {
        toast.error("Gagal memuat data produk atau kategori.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentPage]); 

  const refetchCurrentPage = async () => {
    setIsLoading(true);
    try {
      const productsRes = await fetch(`/api/products?page=${currentPage}`);
      const productsData = await productsRes.json();
      setProducts(productsData.products);
      setTotalPages(productsData.totalPages);
    } catch (error) {
        toast.error("Gagal memuat ulang data produk.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.categoryId || !editor?.getText()) {
      toast.error("Nama Produk, Harga, Kategori, dan Deskripsi wajib diisi.");
      return;
    }
    setUploading(true);
    let imageUrl = formData.imageUrl;

    if (selectedFile) {
      const fileFormData = new FormData();
      fileFormData.append('file', selectedFile);
      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: fileFormData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          imageUrl = uploadData.url; 
        } else {
          throw new Error('Gagal mengunggah gambar.');
        }
      } catch (error) {
        toast.error('Terjadi kesalahan saat mengunggah gambar.');
        setUploading(false);
        return;
      }
    }

    const productData = {
      ...formData,
      price: parseInt(formData.price),
      stock: parseInt(formData.stock), 
      categoryId: parseInt(formData.categoryId),
      imageUrl: imageUrl, 
    };

    const url = isEditing ? `/api/products/${isEditing}` : '/api/products';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const productRes = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!productRes.ok) {
        throw new Error('Gagal menyimpan data produk.');
      }
      
      toast.success(isEditing ? 'Produk berhasil diperbarui!' : 'Produk baru berhasil ditambahkan!');
      resetForm();
      await refetchCurrentPage();
    } catch (error) {
      toast.error('Gagal menyimpan produk.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    toast('Apakah Anda yakin ingin menghapus produk ini?', {
      action: {
        label: 'Hapus',
        onClick: async () => {
          try {
            await fetch(`/api/products/${id}`, { method: 'DELETE' });
            toast.success('Produk berhasil dihapus.');
            await refetchCurrentPage();
          } catch (error) {
            toast.error('Gagal menghapus produk.');
          }
        },
      },
      cancel: {
        label: 'Batal',
        onClick: () => {}, 
      },
    });
  };
  
  const handleEdit = (product: Product) => {
    setIsEditing(product.id);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(), 
      categoryId: product.categoryId.toString(),
      imageUrl: product.imageUrl,
      description: product.description || '',
    });
    setShowForm(true);
    setSelectedFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const resetForm = () => {
    setShowForm(false);
    setIsEditing(null);
    setSelectedFile(null);
    setFormData({ name: '', price: '', categoryId: '', stock: '0', imageUrl: '/products/default.jpg', description: '' });
    editor?.commands.clearContent();
  };

  if (isLoading && products.length === 0) {
    return <ProductsGridSkeleton  />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Produk</h1>
          <p className="text-gray-500 mt-1">Kelola semua produk di toko Anda.</p>
        </div>
        <button className="btn flex items-center gap-2" onClick={() => { setShowForm(!showForm); if (isEditing) resetForm(); }}>
          <PlusIcon className="w-5 h-5" />
          <span>{showForm && !isEditing ? 'Batal' : 'Tambah Produk'}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-lg animate-fade-in">
          <h2 className="text-2xl font-semibold mb-6">{isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Nama Produk" required className="input-field" />
              <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} required className="input-field">
                <option value="" disabled>Pilih Kategori</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="Harga" required className="input-field" />
              <input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} placeholder="Jumlah Stok" required className="input-field" />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">Deskripsi Produk</label>
              <div className="border border-gray-300 rounded-lg">
                <Toolbar editor={editor} />
                <EditorContent editor={editor} />
              </div>
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">Gambar Produk</label>
              <div className="flex items-center gap-4">
                {(selectedFile || (isEditing && formData.imageUrl)) && (
                  <Image 
                    src={selectedFile ? URL.createObjectURL(selectedFile) : formData.imageUrl} 
                    alt="Preview" 
                    width={80} 
                    height={80} 
                    className="rounded-lg object-cover" 
                  />
                )}
                <input type="file" onChange={handleFileChange} accept="image/*" className="input-field flex-1" />
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4">
              <button type="button" onClick={resetForm} className="btn bg-gray-200 text-gray-800 hover:bg-gray-300">Batal</button>
              <button type="submit" className="btn" disabled={uploading}>
                {uploading ? 'Menyimpan...' : (isEditing ? 'Update Produk' : 'Simpan Produk')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </div>
      
      {products.length === 0 && !isLoading && (
        <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-500">Belum ada produk yang ditambahkan.</p>
        </div>
      )}

      <div className="mt-8">
        <Pagination currentPage={currentPage} totalPages={totalPages} />
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
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Komponen wrapper untuk Suspense
export default function ProductsManagementPage() {
    return (
        <Suspense fallback={<ProductsGridSkeleton  />}>
            <ProductsManagementComponent />
        </Suspense>
    )
}
