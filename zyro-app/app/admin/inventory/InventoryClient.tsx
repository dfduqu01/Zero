'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  Minus,
  Edit,
  History,
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  price: number;
  brand: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
}

interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: string;
  quantity_change: number;
  quantity_after: number;
  reason: string | null;
  created_by_user_id: string | null;
  created_at: string;
}

interface Stats {
  totalProducts: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

interface InventoryClientProps {
  initialProducts: Product[];
  stats: Stats;
  adminUserId: string;
}

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type AdjustmentType = 'add' | 'remove' | 'set';

export default function InventoryClient({
  initialProducts,
  stats: initialStats,
  adminUserId,
}: InventoryClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  // Get stock status for a product
  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) return 'out_of_stock';
    if (product.stock_quantity <= product.low_stock_threshold) return 'low_stock';
    return 'in_stock';
  };

  // Filter and search products
  const filteredProducts = products.filter((product) => {
    // Filter by stock status
    if (filter !== 'all') {
      const status = getStockStatus(product);
      if (status !== filter) return false;
    }

    // Search by name or SKU
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Open adjustment modal
  const openAdjustmentModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentType('add');
    setAdjustmentQuantity('');
    setAdjustmentReason('');
    setShowAdjustmentModal(true);
  };

  // Open history modal
  const openHistoryModal = async (product: Product) => {
    setSelectedProduct(product);
    setShowHistoryModal(true);

    // Fetch inventory movements for this product
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching movements:', error);
      return;
    }

    setMovements(data || []);
  };

  // Handle stock adjustment
  const handleStockAdjustment = async () => {
    if (!selectedProduct) return;

    const quantity = parseInt(adjustmentQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Por favor ingresa una cantidad válida');
      return;
    }

    if (!adjustmentReason.trim()) {
      alert('Por favor ingresa una razón para el ajuste');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate new stock quantity
      let newStockQuantity = selectedProduct.stock_quantity;
      let quantityChange = 0;

      if (adjustmentType === 'add') {
        newStockQuantity += quantity;
        quantityChange = quantity;
      } else if (adjustmentType === 'remove') {
        newStockQuantity = Math.max(0, newStockQuantity - quantity);
        quantityChange = -(Math.min(quantity, selectedProduct.stock_quantity));
      } else if (adjustmentType === 'set') {
        quantityChange = quantity - selectedProduct.stock_quantity;
        newStockQuantity = quantity;
      }

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStockQuantity })
        .eq('id', selectedProduct.id);

      if (updateError) {
        console.error('Error updating stock:', updateError);
        alert('Error al actualizar el inventario');
        return;
      }

      // Log inventory movement
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: selectedProduct.id,
          movement_type: 'manual_adjustment',
          quantity_change: quantityChange,
          quantity_after: newStockQuantity,
          reason: adjustmentReason,
          created_by_user_id: adminUserId,
        });

      if (movementError) {
        console.error('Error logging movement:', movementError);
        // Don't show error to user - movement is logged for auditing but not critical
      }

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id ? { ...p, stock_quantity: newStockQuantity } : p
        )
      );

      // Recalculate stats
      const updatedProducts = products.map((p) =>
        p.id === selectedProduct.id ? { ...p, stock_quantity: newStockQuantity } : p
      );
      const newInStockCount = updatedProducts.filter(
        (p) => p.stock_quantity > p.low_stock_threshold
      ).length;
      const newLowStockCount = updatedProducts.filter(
        (p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold
      ).length;
      const newOutOfStockCount = updatedProducts.filter((p) => p.stock_quantity === 0)
        .length;

      setStats({
        ...stats,
        inStockCount: newInStockCount,
        lowStockCount: newLowStockCount,
        outOfStockCount: newOutOfStockCount,
      });

      alert('Inventario actualizado exitosamente');
      setShowAdjustmentModal(false);
      setSelectedProduct(null);
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar el ajuste');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate preview stock based on adjustment
  const getPreviewStock = () => {
    if (!selectedProduct) return 0;
    const quantity = parseInt(adjustmentQuantity) || 0;

    if (adjustmentType === 'add') {
      return selectedProduct.stock_quantity + quantity;
    } else if (adjustmentType === 'remove') {
      return Math.max(0, selectedProduct.stock_quantity - quantity);
    } else {
      return quantity;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Inventario
        </h1>
        <p className="text-gray-600">
          Controla los niveles de stock y realiza ajustes manuales de inventario.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              En Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-2xl font-bold text-green-700">{stats.inStockCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-800">
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-2xl font-bold text-yellow-700">{stats.lowStockCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-800">
              Agotado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-2xl font-bold text-red-700">{stats.outOfStockCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={filter === 'in_stock' ? 'default' : 'outline'}
            onClick={() => setFilter('in_stock')}
            size="sm"
            className="flex items-center gap-1"
          >
            <CheckCircle className="h-3 w-3" />
            En Stock
          </Button>
          <Button
            variant={filter === 'low_stock' ? 'default' : 'outline'}
            onClick={() => setFilter('low_stock')}
            size="sm"
            className="flex items-center gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            Stock Bajo
          </Button>
          <Button
            variant={filter === 'out_of_stock' ? 'default' : 'outline'}
            onClick={() => setFilter('out_of_stock')}
            size="sm"
            className="flex items-center gap-1"
          >
            <XCircle className="h-3 w-3" />
            Agotado
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Marca
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Umbral
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const status = getStockStatus(product);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{product.sku}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {product.brand?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`text-sm font-semibold ${
                              status === 'out_of_stock'
                                ? 'text-red-600'
                                : status === 'low_stock'
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                            }`}
                          >
                            {product.stock_quantity}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {product.low_stock_threshold}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {status === 'in_stock' && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              En Stock
                            </Badge>
                          )}
                          {status === 'low_stock' && (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                              Stock Bajo
                            </Badge>
                          )}
                          {status === 'out_of_stock' && (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                              Agotado
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAdjustmentModal(product)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Ajustar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openHistoryModal(product)}
                            >
                              <History className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            {/* Header */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">Ajustar Inventario</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedProduct.name}</p>
              <p className="text-xs text-gray-500">SKU: {selectedProduct.sku}</p>
            </div>

            {/* Current Stock */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Stock Actual</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedProduct.stock_quantity} unidades
              </p>
            </div>

            {/* Adjustment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Ajuste
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={adjustmentType === 'add' ? 'default' : 'outline'}
                  onClick={() => setAdjustmentType('add')}
                  className="flex items-center justify-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
                <Button
                  variant={adjustmentType === 'remove' ? 'default' : 'outline'}
                  onClick={() => setAdjustmentType('remove')}
                  className="flex items-center justify-center gap-1"
                >
                  <Minus className="h-4 w-4" />
                  Quitar
                </Button>
                <Button
                  variant={adjustmentType === 'set' ? 'default' : 'outline'}
                  onClick={() => setAdjustmentType('set')}
                  className="flex items-center justify-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Fijar
                </Button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <Input
                type="number"
                min="1"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
                placeholder="Ingresa la cantidad"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón *
              </label>
              <textarea
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Daño de producto, Corrección de inventario, etc."
              />
            </div>

            {/* Preview */}
            {adjustmentQuantity && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 mb-1">Nuevo Stock</p>
                <p className="text-xl font-bold text-blue-900">
                  {getPreviewStock()} unidades
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAdjustmentModal(false);
                  setSelectedProduct(null);
                }}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleStockAdjustment}
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Ajuste'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory History Modal */}
      {showHistoryModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Historial de Inventario</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedProduct.name}</p>
                <p className="text-xs text-gray-500">SKU: {selectedProduct.sku}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedProduct(null);
                }}
              >
                X
              </Button>
            </div>

            {/* Current Stock */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Stock Actual</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedProduct.stock_quantity} unidades
              </p>
            </div>

            {/* Movement List */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">
                Últimos Movimientos
              </h3>
              {movements.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay movimientos registrados
                </p>
              ) : (
                <div className="space-y-2">
                  {movements.map((movement) => (
                    <div
                      key={movement.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={
                                movement.quantity_change > 0
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }
                            >
                              {movement.quantity_change > 0 ? '+' : ''}
                              {movement.quantity_change}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {movement.movement_type === 'manual_adjustment' &&
                                'Ajuste Manual'}
                              {movement.movement_type === 'order' && 'Orden'}
                              {movement.movement_type === 'erp_sync' && 'Sincronización ERP'}
                              {movement.movement_type === 'return' && 'Devolución'}
                            </span>
                          </div>
                          {movement.reason && (
                            <p className="text-sm text-gray-700">{movement.reason}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Stock después: {movement.quantity_after} unidades
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(movement.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(movement.created_at).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
