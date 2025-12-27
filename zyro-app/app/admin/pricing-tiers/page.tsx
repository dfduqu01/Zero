import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TierEditor from './TierEditor';
import Link from 'next/link';
import { Calculator } from 'lucide-react';

export default async function PricingTiersPage() {
  const supabase = await createClient();

  const { data: tiers, error } = await supabase
    .from('pricing_tiers')
    .select('*')
    .eq('is_active', true)
    .order('min_cost');

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Niveles de Precio</h1>
        <p className="text-red-600">Error cargando niveles de precio: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Niveles de Precio</h1>
          <p className="text-gray-600">Define reglas de markup basadas en el costo del producto</p>
        </div>
      </div>

      {/* Important Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calculator className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Los cambios a los niveles no actualizan automáticamente los precios de productos
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                Después de editar los niveles, debes ejecutar un recálculo de precios para aplicar las nuevas reglas de markup a tus productos.
              </p>
              <Link
                href="/admin/pricing-recalculation"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Calculator className="w-4 h-4" />
                Ir a Recálculo de Precios
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Niveles Actuales</CardTitle>
          <CardDescription>
            Edita multiplicadores de markup para diferentes rangos de costo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TierEditor initialTiers={tiers || []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cómo Funcionan los Niveles de Precio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-700 space-y-2">
            <p className="font-medium">Los niveles definen las reglas de markup:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Los productos se asignan automáticamente a niveles basados en su costo Dubros</li>
              <li>Cada nivel tiene un rango de costo (mín-máx) y multiplicador de markup</li>
              <li>Productos por docena: el costo Dubros se divide por 12 antes de aplicar el nivel</li>
              <li>Los precios manuales se preservan cuando respectOverrides está marcado</li>
            </ul>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Ejemplo:</p>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• Producto con $15 de costo Dubros → nivel Estándar (2.2x markup)</div>
              <div>• Fórmula 1: precio = $25 + ($15 × 2.2) = $58.00</div>
              <div>• Fórmula 2: precio = $15 × 2.2 = $33.00 (envío en checkout)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
