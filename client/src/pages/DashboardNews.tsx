import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Toolbar } from '../ui/Toolbar';
import { toast } from 'sonner';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface News {
  id: number;
  title: string;
  excerpt: string;
  content?: string;
  imageUrl: string;
  author: string;
  slug: string;
}

function NewsCard({
  item,
  onEdit,
  onDelete,
}: {
  item: News;
  onEdit: (item: News) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 group flex flex-col h-full">
      <div className="relative h-48 w-full overflow-hidden bg-gray-50">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-gray-900 text-base mb-2 truncate group-hover:text-blue-600 transition-colors">
          {item.title}
        </h3>
        <p className="text-sm text-gray-500 mb-4 h-10 overflow-hidden leading-relaxed">{item.excerpt}</p>
        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Oleh: <span className="text-gray-900 font-bold">{item.author}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(item)}
              className="p-2 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-blue-600 transition-colors"
              title="Edit Berita"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
              title="Hapus Berita"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardNews() {
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
      setFormData((prev) => ({ ...prev, content: editor.getHTML() }));
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none w-full min-h-[150px] p-4 text-sm leading-relaxed',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== formData.content) {
      editor.commands.setContent(formData.content);
    }
  }, [formData.content, editor]);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      setNews(data?.news || data || []);
    } catch (error) {
      console.error('Gagal mengambil data berita:', error);
      toast.error('Gagal memuat data berita.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.excerpt || !editor?.getText().trim() || !formData.author) {
      toast.error('Judul, excerpt, konten, dan penulis wajib diisi.');
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

    const slug = formData.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
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

      toast.success(isEditing ? 'Berita berhasil diperbarui!' : 'Berita berhasil ditambahkan!');
      resetForm();
      fetchNews();
    } catch (error) {
      toast.error('Gagal menyimpan berita.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = window.confirm('Apakah Anda yakin ingin menghapus berita ini?');
    if (!isConfirmed) return;

    try {
      await fetch(`/api/news/${id}`, { method: 'DELETE' });
      toast.success('Berita berhasil dihapus.');
      fetchNews();
    } catch (error) {
      toast.error('Gagal menghapus berita.');
    }
  };

  const handleEdit = (item: News) => {
    setIsEditing(item.id);
    setFormData({
      title: item.title,
      excerpt: item.excerpt,
      content: item.content || '',
      author: item.author,
      imageUrl: item.imageUrl,
      slug: item.slug,
    });
    setShowForm(true);
    setSelectedFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(null);
    setSelectedFile(null);
    setFormData({ title: '', excerpt: '', content: '', author: '', imageUrl: '/news/default.jpg', slug: '' });
    editor?.commands.clearContent();
  };

  if (isLoading && news.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Manajemen Berita</h1>
          <p className="text-gray-500 mt-1 text-sm">Kelola semua berita dan artikel di website Anda.</p>
        </div>
        <button
          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 shadow-sm shadow-blue-100"
          onClick={() => {
            setShowForm(!showForm);
            if (isEditing) resetForm();
          }}
        >
          <PlusIcon className="w-5 h-5" />
          <span>{showForm && !isEditing ? 'Batal' : 'Tambah Berita'}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Berita' : 'Tambah Berita Baru'}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Judul Berita</label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Judul Berita"
                  required
                  className="w-full p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Penulis</label>
                <input
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Nama Penulis"
                  required
                  className="w-full p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kutipan (Excerpt)</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Insight Singkat / Kutipan artikel"
                required
                className="w-full p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm leading-relaxed"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Konten Lengkap</label>
              <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                <Toolbar editor={editor} />
                <EditorContent editor={editor} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Gambar Berita</label>
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
                {uploading ? 'Menyimpan...' : isEditing ? 'Update Berita' : 'Simpan Berita'}
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
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm">Belum ada berita yang ditambahkan.</p>
        </div>
      )}
    </div>
  );
}
