'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

interface Category {
  id: number;
  name: string;
}

interface FilterProps {
  categories: Category[];
}

export default function Filter({ categories }: FilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State untuk menyimpan kategori yang dipilih
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    searchParams.getAll('categoryId').map(Number)
  );
  
  // State untuk menyimpan nilai input harga secara langsung
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || 5000000,
  ]);

  // Debounce untuk semua perubahan filter
  const applyFilters = useDebouncedCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');

    // Handle filter kategori
    params.delete('categoryId');
    if (selectedCategories.length > 0) {
      selectedCategories.forEach(id => params.append('categoryId', String(id)));
    }

    // Handle filter harga
    if (priceRange[0] > 0) {
      params.set('minPrice', String(priceRange[0]));
    } else {
      params.delete('minPrice');
    }

    if (priceRange[1] > 0 && priceRange[1] < 5000000) {
      params.set('maxPrice', String(priceRange[1]));
    } else {
      params.delete('maxPrice');
    }
    
    router.replace(`${pathname}?${params.toString()}`);
  }, 500); // Waktu debounce 500ms

  // useEffect sekarang hanya memanggil fungsi applyFilters
  useEffect(() => {
    applyFilters();
  }, [selectedCategories, priceRange, applyFilters]);

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, index: 0 | 1) => {
    const newPriceRange = [...priceRange] as [number, number];
    const value = e.target.value;
    newPriceRange[index] = value === '' ? 0 : Number(value);
    setPriceRange(newPriceRange);
  };

  return (
    <div className="card sticky top-24 p-5">
      <h3 className="border-b pb-2 text-lg font-semibold">Filter</h3>

      <div className="mb-6 mt-4">
        <h4 className="mb-3 font-semibold">Kategori</h4>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center">
              <input
                type="checkbox"
                id={`category-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onChange={() => handleCategoryChange(category.id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`category-${category.id}`} className="ml-3 text-sm text-gray-600">
                {category.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 font-semibold">Harga</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={priceRange[0] === 0 ? '' : priceRange[0]}
            onChange={(e) => handlePriceChange(e, 0)}
            placeholder="Min"
            className="input-field w-full text-sm"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            value={priceRange[1] === 0 || priceRange[1] === 5000000 ? '' : priceRange[1]}
            onChange={(e) => handlePriceChange(e, 1)}
            placeholder="Max"
            className="input-field w-full text-sm"
          />
        </div>
      </div>
    </div>
  );
}