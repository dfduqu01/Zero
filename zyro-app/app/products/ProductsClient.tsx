'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import ProductFilters, { FilterState } from './ProductFilters';

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  gender: 'Male' | 'Female' | 'Unisex' | null;
  brand: { id: string; name: string; slug: string } | null;
  category: { id: string; name: string; slug: string } | null;
  frame_material: { id: string; name: string } | null;
  frame_shape: { id: string; name: string } | null;
  product_images: Array<{
    id: string;
    image_url: string;
    cloudfront_url: string | null;
    display_order: number;
  }>;
}

interface FilterOptions {
  brands: Array<{ id: string; name: string; slug: string }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  materials: Array<{ id: string; name: string }>;
  shapes: Array<{ id: string; name: string }>;
}

interface ProductsClientProps {
  products: Product[];
  filterOptions: FilterOptions;
}

// --- URL ↔ Filter mapping helpers ---

const GENDER_TO_URL: Record<string, string> = {
  Female: 'mujer',
  Male: 'hombre',
  Unisex: 'unisex',
};
const URL_TO_GENDER: Record<string, string> = {
  mujer: 'Female',
  hombre: 'Male',
  unisex: 'Unisex',
};

const SORT_TO_URL: Record<string, string> = {
  newest: 'recientes',
  'price-low': 'precio-asc',
  'price-high': 'precio-desc',
  'name-asc': 'nombre-asc',
  'name-desc': 'nombre-desc',
};
const URL_TO_SORT: Record<string, string> = {
  recientes: 'newest',
  'precio-asc': 'price-low',
  'precio-desc': 'price-high',
  'nombre-asc': 'name-asc',
  'nombre-desc': 'name-desc',
};

const DEFAULT_FILTERS: FilterState = {
  category: 'all',
  brand: 'all',
  material: 'all',
  shape: 'all',
  gender: 'all',
  minPrice: 0,
  maxPrice: 500,
  sortBy: 'newest',
  searchQuery: '',
};

function filtersToParams(filters: FilterState, page: number, filterOptions: FilterOptions): string {
  const params = new URLSearchParams();

  if (filters.category !== 'all') {
    const cat = filterOptions.categories.find((c) => c.id === filters.category);
    if (cat) params.set('categoria', cat.slug);
  }
  if (filters.brand !== 'all') {
    const brand = filterOptions.brands.find((b) => b.id === filters.brand);
    if (brand) params.set('marca', brand.slug);
  }
  if (filters.gender !== 'all') {
    const urlGender = GENDER_TO_URL[filters.gender];
    if (urlGender) params.set('genero', urlGender);
  }
  if (filters.material !== 'all') {
    params.set('material', filters.material);
  }
  if (filters.sortBy !== 'newest') {
    const urlSort = SORT_TO_URL[filters.sortBy];
    if (urlSort) params.set('orden', urlSort);
  }
  if (filters.minPrice !== 0) {
    params.set('precio_min', String(filters.minPrice));
  }
  if (filters.maxPrice !== 500) {
    params.set('precio_max', String(filters.maxPrice));
  }
  if (filters.searchQuery.trim()) {
    params.set('buscar', filters.searchQuery.trim());
  }
  if (page > 1) {
    params.set('pagina', String(page));
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function paramsToFilters(
  searchParams: URLSearchParams,
  filterOptions: FilterOptions
): { filters: FilterState; page: number } {
  const filters: FilterState = { ...DEFAULT_FILTERS };

  const categoriaSlug = searchParams.get('categoria');
  if (categoriaSlug) {
    const cat = filterOptions.categories.find((c) => c.slug === categoriaSlug);
    if (cat) filters.category = cat.id;
  }

  const marcaSlug = searchParams.get('marca');
  if (marcaSlug) {
    const brand = filterOptions.brands.find((b) => b.slug === marcaSlug);
    if (brand) filters.brand = brand.id;
  }

  const genero = searchParams.get('genero');
  if (genero && URL_TO_GENDER[genero]) {
    filters.gender = URL_TO_GENDER[genero];
  }

  const material = searchParams.get('material');
  if (material) {
    const mat = filterOptions.materials.find((m) => m.id === material);
    if (mat) filters.material = mat.id;
  }

  const orden = searchParams.get('orden');
  if (orden && URL_TO_SORT[orden]) {
    filters.sortBy = URL_TO_SORT[orden];
  }

  const precioMin = searchParams.get('precio_min');
  if (precioMin != null) {
    const v = parseInt(precioMin);
    if (!isNaN(v)) filters.minPrice = v;
  }

  const precioMax = searchParams.get('precio_max');
  if (precioMax != null) {
    const v = parseInt(precioMax);
    if (!isNaN(v)) filters.maxPrice = v;
  }

  const buscar = searchParams.get('buscar');
  if (buscar) {
    filters.searchQuery = buscar;
  }

  let page = 1;
  const pagina = searchParams.get('pagina');
  if (pagina) {
    const v = parseInt(pagina);
    if (!isNaN(v) && v > 0) page = v;
  }

  return { filters, page };
}

export default function ProductsClient({ products, filterOptions }: ProductsClientProps) {
  const searchParams = useSearchParams();

  // Parse initial state from URL
  const initial = useMemo(
    () => paramsToFilters(searchParams, filterOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Only on mount
  );

  const [filters, setFilters] = useState<FilterState>(initial.filters);
  const [currentPage, setCurrentPage] = useState(initial.page);
  const itemsPerPage = 12;

  // Debounce timer ref for search
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track the last URL we wrote so we can distinguish our changes from external (back/forward)
  const lastSyncedParams = useRef(searchParams.toString());

  // Sync state from URL on external navigation (back/forward button)
  useEffect(() => {
    const currentParams = searchParams.toString();
    if (currentParams === lastSyncedParams.current) return;
    const { filters: urlFilters, page: urlPage } = paramsToFilters(searchParams, filterOptions);
    setFilters(urlFilters);
    setCurrentPage(urlPage);
  }, [searchParams, filterOptions]);

  // Persist current products URL to sessionStorage so product detail pages can link back
  useEffect(() => {
    try {
      sessionStorage.setItem('products_url', searchParams.toString());
    } catch {
      // Ignore sessionStorage errors
    }
  }, [searchParams]);

  // Sync URL when filters/page change
  // Uses window.history.replaceState() instead of router.replace() for
  // synchronous URL updates — router.replace() is async and causes the URL
  // bar to lag behind, so back-navigation lands on stale page numbers.
  const syncURL = useCallback(
    (newFilters: FilterState, newPage: number) => {
      const qs = filtersToParams(newFilters, newPage, filterOptions);
      const paramsString = qs.startsWith('?') ? qs.slice(1) : '';
      lastSyncedParams.current = paramsString;
      window.history.replaceState(null, '', `/products${qs}`);
      try {
        sessionStorage.setItem('products_url', paramsString);
      } catch {
        // Ignore sessionStorage errors
      }
    },
    [filterOptions]
  );

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => p.product_images && p.product_images.length > 0);

    if (filters.category !== 'all') {
      filtered = filtered.filter((p) => p.category?.id === filters.category);
    }
    if (filters.brand !== 'all') {
      filtered = filtered.filter((p) => p.brand?.id === filters.brand);
    }
    if (filters.material !== 'all') {
      filtered = filtered.filter((p) => p.frame_material?.id === filters.material);
    }
    if (filters.shape !== 'all') {
      filtered = filtered.filter((p) => p.frame_shape?.id === filters.shape);
    }
    if (filters.gender !== 'all') {
      filtered = filtered.filter((p) => p.gender === filters.gender);
    }

    filtered = filtered.filter(
      (p) => p.price >= filters.minPrice && p.price <= filters.maxPrice
    );

    if (filters.searchQuery.trim()) {
      const searchLower = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.brand?.name.toLowerCase().includes(searchLower)
      );
    }

    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
      default:
        break;
    }

    return filtered;
  }, [products, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Handle filter change: reset page to 1, sync URL
  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      setCurrentPage(1);

      // Debounce search to avoid URL spam
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }

      if (newFilters.searchQuery !== filters.searchQuery) {
        searchTimerRef.current = setTimeout(() => {
          syncURL(newFilters, 1);
        }, 300);
      } else {
        syncURL(newFilters, 1);
      }
    },
    [filters.searchQuery, syncURL]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      syncURL(filters, newPage);
    },
    [filters, syncURL]
  );

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // Pagination component
  const PaginationControls = () => (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        &larr; Anterior
      </button>

      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          const showPage =
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1);

          const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
          const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

          if (showEllipsisBefore || showEllipsisAfter) {
            return (
              <span key={page} className="px-2 py-2 text-gray-500">
                ...
              </span>
            );
          }

          if (!showPage) return null;

          return (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 border rounded-md text-sm font-medium ${
                currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Siguiente &rarr;
      </button>
    </div>
  );

  return (
    <>
      {/* Filters */}
      <ProductFilters
        brands={filterOptions.brands}
        categories={filterOptions.categories}
        materials={filterOptions.materials}
        shapes={filterOptions.shapes}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando {filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, filteredProducts.length)} de {filteredProducts.length} productos
          {filteredProducts.length !== products.length && ` (${products.length} totales)`}
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </p>
        )}
      </div>

      {/* Top Pagination */}
      {totalPages > 1 && (
        <div className="mb-6">
          <PaginationControls />
        </div>
      )}

      {/* Products Grid */}
      {paginatedProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No se encontraron productos</h3>
          <p className="mt-1 text-sm text-gray-500">
            Intenta ajustar tus filtros para ver más resultados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedProducts.map((product) => {
            const firstImage = product.product_images?.sort(
              (a, b) => a.display_order - b.display_order
            )[0];

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Product Image */}
                <div className="relative bg-gray-100 overflow-hidden flex items-center justify-center min-h-[200px]">
                  {firstImage ? (
                    <Image
                      src={firstImage.cloudfront_url || firstImage.image_url}
                      alt={product.name}
                      width={400}
                      height={400}
                      className="object-contain w-full h-auto group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center text-gray-400 w-full min-h-[200px]">
                      <svg
                        className="w-16 h-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  {/* Stock Badge */}
                  {product.stock_quantity <= product.low_stock_threshold && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                      Pocas Unidades
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  {product.brand && (
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      {product.brand.name}
                    </p>
                  )}
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-gray-700">
                    {product.name}
                  </h3>
                  <div className="text-xs text-gray-500 mb-2">
                    {product.category?.name} • {product.frame_material?.name}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{product.stock_quantity} disponibles</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <div className="mt-8">
          <PaginationControls />
        </div>
      )}
    </>
  );
}
