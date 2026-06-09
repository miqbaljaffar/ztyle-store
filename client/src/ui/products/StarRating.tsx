'use client'

interface StarRatingProps {
    rating: number;
    count?: number;
}

export default function StarRating({ rating, count }: StarRatingProps) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
        stars.push(<span key={`full-${i}`} style={{ color: '#ffc107' }}>&#9733;</span>);
    }
    for (let i = 0; i < emptyStars; i++) {
        stars.push(<span key={`empty-${i}`} style={{ color: '#e4e5e9' }}>&#9733;</span>);
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex text-2xl">{stars}</div>
            {count !== undefined && <span className="text-gray-500 text-sm">({count} ulasan)</span>}
        </div>
    );
}