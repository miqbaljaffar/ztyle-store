const CardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <div className="flex items-start gap-5">
      <div className="h-12 w-12 rounded-lg bg-gray-200 animate-pulse"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

const ChartCardSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-80 w-full bg-gray-200 rounded-lg animate-pulse"></div>
    </div>
);

const TableRowSkeleton = () => (
  <tr className="w-full border-b border-gray-100 last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
    <td className="relative overflow-hidden whitespace-nowrap py-3 pl-6 pr-3">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-100"></div>
        <div className="h-6 w-24 rounded bg-gray-100"></div>
      </div>
    </td>
    <td className="whitespace-nowrap px-3 py-3">
      <div className="h-6 w-32 rounded bg-gray-100"></div>
    </td>
    <td className="whitespace-nowrap px-3 py-3">
      <div className="h-6 w-16 rounded bg-gray-100"></div>
    </td>
  </tr>
);

export const TableSkeleton = () => (
  <div className="card">
    <table className="min-w-full text-gray-900">
      <thead className="rounded-lg text-left text-sm font-normal">
        <tr>
          <th scope="col" className="px-4 py-5 font-medium sm:pl-6">Product</th>
          <th scope="col" className="px-3 py-5 font-medium">Category</th>
          <th scope="col" className="px-3 py-5 font-medium">Price</th>
        </tr>
      </thead>
      <tbody className="bg-white">
        <TableRowSkeleton />
        <TableRowSkeleton />
        <TableRowSkeleton />
        <TableRowSkeleton />
        <TableRowSkeleton />
      </tbody>
    </table>
  </div>
);

const ProductCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
    <div className="h-48 w-full bg-gray-200 animate-pulse"></div>
    <div className="p-5">
      <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
      <div className="h-7 w-1/2 bg-gray-200 rounded animate-pulse mb-3"></div>
      <div className="flex justify-between items-center">
        <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

export const ProductsGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <ProductCardSkeleton />
    <ProductCardSkeleton />
    <ProductCardSkeleton />
    <ProductCardSkeleton />
    <ProductCardSkeleton />
    <ProductCardSkeleton />
  </div>
);

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-9 w-64 mb-2 rounded bg-gray-200 animate-pulse"></div>
        <div className="h-5 w-80 rounded bg-gray-200 animate-pulse"></div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCardSkeleton />
        </div>
        <div>
          <ChartCardSkeleton />
        </div>
         <div className="lg:col-span-3">
          <ChartCardSkeleton />
        </div>
      </div>
    </div>
  );
};