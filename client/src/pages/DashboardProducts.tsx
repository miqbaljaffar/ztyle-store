import { useState, useEffect, Suspense } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../ui/pagination';
import { ProductsGridSkeleton } from '../ui/skeletons';
import { toast } from 'sonner';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Toolbar } from '../ui/Toolbar';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: { id: number; name: string };
  imageUrl: string;
  description?: string;
  categoryId: number;
}

interface Category {
  id: number;
  name: string;
}

function ProductCard({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      <div className="relative">
        <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
        <span className="absolute top-3 right-3 bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
          {product.category?.name || 'N/A'}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-base truncate">{product.name}</h3>
        <p className="text-blue-600 font-black text-lg mt-1 mb-3">Rp{product.price.toLocaleString('id-ID')}</p>
        <div className="flex justify-between items-center text-sm text-gray-500 pt-3 border-t border-gray-50">
          <span>
            Stok: <span className="font-bold text-gray-900">{product.stock}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(product)}
              className="p-2 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-blue-600 transition-colors"
              title="Edit Produk"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
              title="Hapus Produk"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsManagementComponent() {
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
      setFormData((prev) => ({ ...prev, description: editor.getHTML() }));
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none w-full min-h-[150px] p-4 text-sm leading-relaxed',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== formData.description) {
      editor.commands.setContent(formData.description);
    }
  }, [formData.description, editor]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`/api/products?page=${currentPage}`),
          fetch('/api/categories'),
        ]);
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        setProducts(productsData.products || []);
        setTotalPages(productsData.totalPages || 0);
        setCategories(
          Array.isArray(categoriesData.categories)
            ? categoriesData.categories
            : Array.isArray(categoriesData)
            ? categoriesData
            : []
        );
      } catch (error) {
        toast.error('Gagal memuat data produk atau kategori.');
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
      setProducts(productsData.products || []);
      setTotalPages(productsData.totalPages || 0);
    } catch (error) {
      toast.error('Gagal memuat ulang data produk.');
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
    if (!formData.name || !formData.price || !formData.categoryId || !editor?.getText().trim()) {
      toast.error('Nama Produk, Harga, Kategori, dan Deskripsi wajib diisi.');
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
      price: parseInt(formData.price, 10),
      stock: parseInt(formData.stock, 10),
      categoryId: parseInt(formData.categoryId, 10),
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
    const isConfirmed = window.confirm('Apakah Anda yakin ingin menghapus produk ini?');
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Produk berhasil dihapus.');
        await refetchCurrentPage();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Gagal menghapus produk.');
      }
    } catch (error) {
      toast.error('Gagal menghapus produk.');
    }
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
    setFormData({
      name: '',
      price: '',
      categoryId: '',
      stock: '0',
      imageUrl: '/products/default.jpg',
      description: '',
    });
    editor?.commands.clearContent();
  };

  if (isLoading && products.length === 0) {
    return <ProductsGridSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Manajemen Produk</h1>
          <p className="text-gray-500 mt-1 text-sm">Kelola semua produk di toko Anda.</p>
        </div>
        <button
          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 shadow-sm shadow-blue-100"
          onClick={() => {
            setShowForm(!showForm);
            if (isEditing) resetForm();
          }}
        >
          <PlusIcon className="w-5 h-5" />
          <span>{showForm && !isEditing ? 'Batal' : 'Tambah Produk'}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm animate-fade-in space-y-6">
          <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Produk</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Kemeja Flanel Slim Fit"
                  required
                  className="w-full p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kategori</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                  className="w-full p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="" disabled>
                    Pilih Kategori
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Harga (Rupiah)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Harga produk"
                  required
                  className="w-full p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Jumlah Stok</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="Stok produk"
                  required
                  className="w-full p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Deskripsi Produk</label>
              <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                <Toolbar editor={editor} />
                <EditorContent editor={editor} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Gambar Produk</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {(selectedFile || (isEditing && formData.imageUrl)) && (
                  <img
                    src={selectedFile ? URL.createObjectURL(selectedFile) : formData.imageUrl}
                    alt="Preview"
                    className="w-20 h-20 rounded-xl object-cover border border-gray-100 bg-gray-50"
                  />
                )}
                <input type="file" onChange={handleFileChange} accept="image/*" className="w-full p-3 rounded-xl border border-gray-200 text-xs" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
              <button
                type="button"
                onClick={resetForm}
                className="py-2.5 px-5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
              >
                {uploading ? 'Menyimpan...' : isEditing ? 'Update Produk' : 'Simpan Produk'}
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
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm">Belum ada produk yang ditambahkan.</p>
        </div>
      )}

      <div className="mt-8">
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </div>
  );
}

export default function DashboardProducts() {
  return (
    <Suspense fallback={<ProductsGridSkeleton />}>
      <ProductsManagementComponent />
    </Suspense>
  );
}
