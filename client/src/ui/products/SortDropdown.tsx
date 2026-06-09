import { useSearchParams } from 'react-router-dom';

export default function SortDropdown() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSort = searchParams.get('sort') || 'newest';

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    params.set('page', '1'); 
    setSearchParams(params);
  };

  return (
    <div className="flex items-center">
      <label htmlFor="sort" className="mr-2 text-sm font-medium shrink-0">
        Urutkan:
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={handleSortChange}
        className="input-field rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 w-full"
        style={{ 
            backgroundColor: '#fff', 
            padding: '8px 12px',
            lineHeight: '1.5'
        }}
      >
        <option value="newest">Terbaru</option>
        <option value="popularity">Terpopuler</option>
        <option value="price-asc">Harga Terendah</option>
        <option value="price-desc">Harga Tertinggi</option>
      </select>
    </div>
  );
}