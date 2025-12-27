'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Edit2, Save, X } from 'lucide-react';

interface PricingTier {
  id: string;
  tier_name: string;
  min_cost: number;
  max_cost: number | null;
  markup_multiplier: number;
  display_order: number;
}

interface TierEditorProps {
  initialTiers: PricingTier[];
}

export default function TierEditor({ initialTiers }: TierEditorProps) {
  const router = useRouter();
  const [tiers, setTiers] = useState<PricingTier[]>(initialTiers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PricingTier>>({});
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (tier: PricingTier) => {
    setEditingId(tier.id);
    setEditForm({
      tier_name: tier.tier_name,
      min_cost: tier.min_cost,
      max_cost: tier.max_cost,
      markup_multiplier: tier.markup_multiplier,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveTier = async (tierId: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/pricing-tiers/${tierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar nivel');
      }

      // Update local state
      setTiers(tiers.map(t =>
        t.id === tierId
          ? { ...t, ...editForm } as PricingTier
          : t
      ));

      setEditingId(null);
      setEditForm({});
      router.refresh();
    } catch (error) {
      console.error('Error saving tier:', error);
      alert('Error guardando nivel. Por favor intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {tiers.map((tier) => (
        <div key={tier.id} className="border rounded-lg p-4">
          {editingId === tier.id ? (
            // Edit Mode
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del Nivel</label>
                <input
                  type="text"
                  value={editForm.tier_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, tier_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Costo Mínimo ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.min_cost || 0}
                    onChange={(e) => setEditForm({ ...editForm, min_cost: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Costo Máximo ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.max_cost || ''}
                    onChange={(e) => setEditForm({ ...editForm, max_cost: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="∞ (dejar vacío)"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Multiplicador de Markup</label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.markup_multiplier || 0}
                  onChange={(e) => setEditForm({ ...editForm, markup_multiplier: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => saveTier(tier.id)}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button
                  onClick={cancelEdit}
                  disabled={isSaving}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <X size={16} />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{tier.tier_name}</h3>
                <p className="text-sm text-gray-600">
                  Dubros Cost: ${tier.min_cost} - {tier.max_cost ? `$${tier.max_cost}` : '∞'}
                </p>
                <p className="text-sm font-medium text-blue-600">
                  Markup: {tier.markup_multiplier}x
                </p>

                <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                  <div className="font-medium mb-1">Cálculo de Ejemplo:</div>
                  {(() => {
                    const exampleCost = tier.min_cost === 0 ? 15 : tier.min_cost + 10;
                    const sellingPrice = 25 + (exampleCost * Number(tier.markup_multiplier));
                    const profit = sellingPrice - (exampleCost + 25);
                    const margin = ((profit / (exampleCost + 25)) * 100).toFixed(1);

                    return (
                      <>
                        <div>Dubros: ${exampleCost}</div>
                        <div>Precio de Venta: $25 + (${exampleCost} × {tier.markup_multiplier}) = <strong>${sellingPrice}</strong></div>
                        <div className="text-green-600 font-medium">
                          Ganancia: ${profit.toFixed(2)} ({margin}% margen)
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <Button
                onClick={() => startEdit(tier)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit2 size={16} />
                Editar
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
