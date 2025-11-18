'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import type { ProductWithRelations } from '@/lib/types/product';
import { formatPrice, isLowStock, isOutOfStock } from '@/lib/utils/product-helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';

interface ProductsClientProps {
  initialProducts: ProductWithRelations[];
}

export default function ProductsClient({ initialProducts }: ProductsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<ProductWithRelations[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'low-stock' | 'out-of-stock'>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Filter products
  const filteredProducts = products.filter((product) => {
    // Search filter
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    switch (filterStatus) {
      case 'active':
        return product.is_active;
      case 'inactive':
        return !product.is_active;
      case 'low-stock':
        return isLowStock(product.stock_quantity, product.low_stock_threshold) && product.is_active;
      case 'out-of-stock':
        return isOutOfStock(product.stock_quantity);
      default:
        return true;
    }
  });

  // Calculate counts for filter buttons
  const counts = {
    all: products.length,
    active: products.filter(p => p.is_active).length,
    inactive: products.filter(p => !p.is_active).length,
    lowStock: products.filter(p => isLowStock(p.stock_quantity, p.low_stock_threshold) && p.is_active).length,
    outOfStock: products.filter(p => isOutOfStock(p.stock_quantity)).length,
  };

  // Handle delete product
  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${productName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setIsDeleting(productId);

    try {
      // Delete product images from storage
      const { data: images } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId);

      if (images && images.length > 0) {
        const filePaths = images.map(img => {
          const url = new URL(img.image_url);
          return url.pathname.split('/').slice(-2).join('/'); // Get product_id/filename
        });

        await supabase.storage.from('product-images').remove(filePaths);
      }

      // Delete product (cascade will handle images table)
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        alert('Error al eliminar el producto');
        return;
      }

      // Update local state
      setProducts(prev => prev.filter(p => p.id !== productId));
      alert('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el producto');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Productos</h1>
          <p className="text-gray-600">Administra el catálogo de productos</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar Producto
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{counts.all}</div>
            <div className="text-sm text-gray-600">Total Productos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{counts.active}</div>
            <div className="text-sm text-gray-600">Activos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-500">{counts.inactive}</div>
            <div className="text-sm text-gray-600">Inactivos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{counts.lowStock}</div>
            <div className="text-sm text-gray-600">Stock Bajo</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{counts.outOfStock}</div>
            <div className="text-sm text-gray-600">Sin Stock</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o marca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            size="sm"
          >
            Todos ({counts.all})
          </Button>
          <Button
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('active')}
            size="sm"
          >
            Activos ({counts.active})
          </Button>
          <Button
            variant={filterStatus === 'inactive' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('inactive')}
            size="sm"
          >
            Inactivos ({counts.inactive})
          </Button>
          <Button
            variant={filterStatus === 'low-stock' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('low-stock')}
            size="sm"
          >
            Stock Bajo ({counts.lowStock})
          </Button>
          <Button
            variant={filterStatus === 'out-of-stock' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('out-of-stock')}
            size="sm"
          >
            Sin Stock ({counts.outOfStock})
          </Button>
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchQuery || filterStatus !== 'all'
                ? 'No se encontraron productos con los filtros aplicados'
                : 'No hay productos registrados'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <Link href="/admin/products/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Producto
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marca
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => {
                    const primaryImage = product.product_images?.[0]?.image_url;
                    const lowStock = isLowStock(product.stock_quantity, product.low_stock_threshold);
                    const outOfStock = isOutOfStock(product.stock_quantity);

                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              {primaryImage ? (
                                <Image
                                  src={primaryImage}
                                  alt={product.name}
                                  width={48}
                                  height={48}
                                  className="h-12 w-12 rounded object-cover"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.category?.name || 'Sin categoría'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-mono">{product.sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.brand?.name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{formatPrice(product.price)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              outOfStock ? 'text-red-600' : lowStock ? 'text-yellow-600' : 'text-gray-900'
                            }`}>
                              {product.stock_quantity}
                            </span>
                            {(lowStock || outOfStock) && (
                              <AlertTriangle className={`h-4 w-4 ${outOfStock ? 'text-red-600' : 'text-yellow-600'}`} />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={product.is_active ? 'bg-green-600' : 'bg-gray-500'}>
                            {product.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/products/${product.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(product.id, product.name)}
                              disabled={isDeleting === product.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
