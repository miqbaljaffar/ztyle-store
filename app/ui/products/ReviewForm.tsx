'use client'

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface ReviewFormProps {
  productId: number;
  orderItemId: number;
  onReviewSubmitted: () => Promise<void>;
}

export default function ReviewForm({ productId, orderItemId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Rating tidak boleh kosong.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, orderItemId, rating, comment }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengirim ulasan.');
      }

      // Panggil server action untuk revalidasi
      await onReviewSubmitted();
      
      // Optional: Arahkan pengguna atau tampilkan pesan sukses
      // router.refresh(); // cara alternatif untuk refresh

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card mt-8">
      <h2 className="text-2xl font-bold mb-4">Tulis Ulasan Anda</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
        <div>
          <label className="block font-medium mb-2">Rating Anda</label>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className="cursor-pointer text-4xl"
                style={{ color: star <= (hoverRating || rating) ? '#ffc107' : '#e4e5e9' }}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                &#9733;
              </span>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="comment" className="block font-medium mb-2">Komentar Anda</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            minLength={10}
            rows={4}
            className="input-field w-full"
            placeholder="Bagaimana kualitas produk ini menurut Anda?"
          />
        </div>
        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading ? 'Mengirim...' : 'Kirim Ulasan'}
        </button>
      </form>
    </div>
  );
}