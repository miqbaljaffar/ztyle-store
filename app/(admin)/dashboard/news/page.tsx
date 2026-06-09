'use client'

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
// Impor hook dan komponen dari TipTap
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Toolbar } from '@/app/(admin)/dashboard/ui/Toolbar';
import { toast } from 'sonner';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// Interface untuk data Berita
interface News {
  id: number;
  title: string;
  excerpt: string;
  content?: string;
  imageUrl: string;
  author: string;
  slug: string;
}

// Komponen Card Berita yang baru dan responsif
function NewsCard({ item, onEdit, onDelete }: { item: News, onEdit: (item: News) => void, onDelete: (id: number) => void }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
            <div className="relative h-48 w-full overflow-hidden">
                <Image src={item.imageUrl} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="p-5">
                <h3 className="font-bold text-lg text-gray-800 mb-2 truncate group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-4 h-10 overflow-hidden">{item.excerpt}</p>
                <div className="flex justify-between items-center">
                    <p className="text-xs font-medium text-gray-500">Oleh: <span className="text-gray-900">{item.author}</span></p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(item)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                            <PencilIcon className="w-5 h-5 text-gray-600"/>
                        </button>
                        <button onClick={() => onDelete(item.id)} className="p-2 rounded-full hover:bg-red-100 transition-colors">
                            <TrashIcon className="w-5 h-5 text-red-500"/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function NewsManagementPage() {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    imageUrl: '/news/default.jpg',
    slug: '',
  });

  // Inisialisasi editor TipTap
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: 'Tulis konten lengkap berita di sini...',
      }),
    ],
    content: formData.content,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, content: editor.getHTML() }));
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none w-full input-field min-h-[150px] p-2',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== formData.content) {
      editor.commands.setContent(formData.content);
    }
  }, [formData.content, editor]);

  // Fungsi untuk mengambil data berita
  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data && Array.isArray(data.news)) {
        setNews(data.news);
      } else {
        setNews([]);
      }
    } catch (error) {
      console.error("Gagal mengambil data berita:", error);
      toast.error("Gagal memuat data berita.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Handler untuk perubahan file gambar
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handler untuk men-submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.excerpt || !editor?.getText() || !formData.author) {
      toast.error("Judul, excerpt, konten, dan penulis wajib diisi.");
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
        console.error(error);
        toast.error('Terjadi kesalahan saat mengunggah gambar.');
        setUploading(false);
        return;
      }
    }

    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const newsData = { ...formData, imageUrl, slug, content: editor.getHTML() };
    const url = isEditing ? `/api/news/${isEditing}` : '/api/news';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsData),
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan data berita.');
      }
      
      toast.success(isEditing ? "Berita berhasil diperbarui!" : "Berita berhasil ditambahkan!");
      resetForm();
      fetchNews();
    } catch (error) {
      console.error("Gagal menyimpan berita:", error);
      toast.error('Gagal menyimpan berita.');
    } finally {
      setUploading(false);
    }
  };
  
  // Handler untuk menghapus berita
  const handleDelete = async (id: number) => {
    toast('Apakah Anda yakin ingin menghapus berita ini?', {
        action: {
            label: 'Hapus',
            onClick: async () => {
                try {
                    await fetch(`/api/news/${id}`, { method: 'DELETE' });
                    toast.success("Berita berhasil dihapus.");
                    fetchNews();
                } catch (error) {
                    console.error("Gagal menghapus berita:", error);
                    toast.error('Gagal menghapus berita.');
                }
            }
        },
        cancel: {
            label: 'Batal',
            onClick: () => {}
        }
    })
  };

  // Handler untuk mode edit
  const handleEdit = (item: News) => {
    setIsEditing(item.id);
    setFormData({
      title: item.title,
      excerpt: item.excerpt,
      content: item.content || '',
      author: item.author,
      imageUrl: item.imageUrl,
      slug: item.slug
    });
    setShowForm(true);
    setSelectedFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Fungsi untuk mereset form
  const resetForm = () => {
    setShowForm(false);
    setIsEditing(null);
    setSelectedFile(null);
    setFormData({ title: '', excerpt: '', content: '', author: '', imageUrl: '/news/default.jpg', slug: '' });
    editor?.commands.clearContent();
  };

  if (isLoading) return <p>Memuat data berita...</p>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Berita</h1>
          <p className="text-gray-500 mt-1">Kelola semua berita dan artikel di website Anda.</p>
        </div>
        <button className="btn flex items-center gap-2" onClick={() => { setShowForm(!showForm); if (isEditing) resetForm(); }}>
          <PlusIcon className="w-5 h-5" />
          <span>{showForm && !isEditing ? 'Batal' : 'Tambah Berita'}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-lg animate-fade-in">
          <h2 className="text-2xl font-semibold mb-6">{isEditing ? 'Edit Berita' : 'Tambah Berita Baru'}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Judul Berita" required className="input-field" />
              <input value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} placeholder="Nama Penulis" required className="input-field" />
            </div>
            <textarea value={formData.excerpt} onChange={(e) => setFormData({...formData, excerpt: e.target.value})} placeholder="Insight Singkat (Excerpt)" required className="input-field" rows={3}></textarea>
            
            <div>
              <label className="block mb-2 font-medium text-gray-700">Konten Lengkap</label>
              <div className="border border-gray-300 rounded-lg">
                <Toolbar editor={editor} />
                <EditorContent editor={editor} />
              </div>
            </div>
            
            <div>
              <label className="block mb-2 font-medium text-gray-700">Gambar Berita</label>
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
                {uploading ? 'Menyimpan...' : (isEditing ? 'Update Berita' : 'Simpan Berita')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item) => (
          <NewsCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </div>
      
      {news.length === 0 && !isLoading && (
        <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-500">Belum ada berita yang ditambahkan.</p>
        </div>
      )}

      {/* Anda bisa menambahkan komponen Pagination di sini jika diperlukan */}

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
