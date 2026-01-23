'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Tags,
  Package,
  Eye,
  EyeOff,
  Search,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  product_count: number;
}

interface Stats {
  totalBrands: number;
  activeBrands: number;
  inactiveBrands: number;
  totalProducts: number;
  activeProducts: number;
}

interface BrandsClientProps {
  initialBrands: Brand[];
  stats: Stats;
}

type BrandFilter = 'all' | 'active' | 'inactive';

export default function BrandsClient({
  initialBrands,
  stats: initialStats,
}: BrandsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<BrandFilter>('all');
  const [updatingBrands, setUpdatingBrands] = useState<Set<string>>(new Set());

  // Filter and search brands
  const filteredBrands = brands.filter((brand) => {
    // Filter by status
    if (filter === 'active' && !brand.is_active) return false;
    if (filter === 'inactive' && brand.is_active) return false;

    // Search by name
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return brand.name.toLowerCase().includes(query);
    }

    return true;
  });

  // Toggle brand active status
  const toggleBrandStatus = async (brand: Brand) => {
    setUpdatingBrands((prev) => new Set(prev).add(brand.id));

    const newStatus = !brand.is_active;

    const { error } = await supabase
      .from('brands')
      .update({ is_active: newStatus })
      .eq('id', brand.id);

    if (error) {
      console.error('Error updating brand:', error);
      alert('Error al actualizar la marca');
    } else {
      // Update local state
      setBrands((prev) =>
        prev.map((b) =>
          b.id === brand.id ? { ...b, is_active: newStatus } : b
        )
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        activeBrands: newStatus ? prev.activeBrands + 1 : prev.activeBrands - 1,
        inactiveBrands: newStatus ? prev.inactiveBrands - 1 : prev.inactiveBrands + 1,
        activeProducts: newStatus
          ? prev.activeProducts + brand.product_count
          : prev.activeProducts - brand.product_count,
      }));
    }

    setUpdatingBrands((prev) => {
      const next = new Set(prev);
      next.delete(brand.id);
      return next;
    });
  };

  // Bulk actions
  const activateAll = async () => {
    const inactiveBrands = brands.filter((b) => !b.is_active);
    if (inactiveBrands.length === 0) return;

    const { error } = await supabase
      .from('brands')
      .update({ is_active: true })
      .in('id', inactiveBrands.map((b) => b.id));

    if (error) {
      console.error('Error activating brands:', error);
      alert('Error al activar las marcas');
    } else {
      router.refresh();
    }
  };

  const deactivateAll = async () => {
    const activeBrands = brands.filter((b) => b.is_active);
    if (activeBrands.length === 0) return;

    if (!confirm(`¿Estás seguro de desactivar ${activeBrands.length} marcas? Esto ocultará ${stats.activeProducts} productos.`)) {
      return;
    }

    const { error } = await supabase
      .from('brands')
      .update({ is_active: false })
      .in('id', activeBrands.map((b) => b.id));

    if (error) {
      console.error('Error deactivating brands:', error);
      alert('Error al desactivar las marcas');
    } else {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Visibility</h1>
          <p className="text-gray-500 mt-1">
            Control which brands and their products are visible to customers
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Brands
            </CardTitle>
            <Tags className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalBrands}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Brands
            </CardTitle>
            <Eye className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.activeBrands}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Hidden Brands
            </CardTitle>
            <EyeOff className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-400">{stats.inactiveBrands}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Visible Products
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.activeProducts}{' '}
              <span className="text-sm font-normal text-gray-500">
                / {stats.totalProducts}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({stats.totalBrands})
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                <Eye className="h-4 w-4 mr-1" />
                Active ({stats.activeBrands})
              </Button>
              <Button
                variant={filter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('inactive')}
              >
                <EyeOff className="h-4 w-4 mr-1" />
                Hidden ({stats.inactiveBrands})
              </Button>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={activateAll}
              disabled={stats.inactiveBrands === 0}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Activate All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deactivateAll}
              disabled={stats.activeBrands === 0}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Deactivate All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Brands List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Brands ({filteredBrands.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredBrands.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No brands found matching your search.
              </p>
            ) : (
              filteredBrands.map((brand) => (
                <div
                  key={brand.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    brand.is_active
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={brand.is_active}
                      onCheckedChange={() => toggleBrandStatus(brand)}
                      disabled={updatingBrands.has(brand.id)}
                    />
                    <div>
                      <p
                        className={`font-medium ${
                          brand.is_active ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {brand.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {brand.product_count} products
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {brand.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Eye className="h-3 w-3 mr-1" />
                        Visible
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hidden
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
