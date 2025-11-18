'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import type {
  PrescriptionType,
  LensType,
  LensIndex,
  ViewArea,
} from '@/lib/types/prescription';

interface Props {
  initialPrescriptionTypes: PrescriptionType[];
  initialLensTypes: LensType[];
  initialLensIndexes: LensIndex[];
  initialViewAreas: ViewArea[];
}

type TabType = 'prescription_types' | 'lens_types' | 'lens_indexes' | 'view_areas';

export default function PrescriptionConfigClient({
  initialPrescriptionTypes,
  initialLensTypes,
  initialLensIndexes,
  initialViewAreas,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('prescription_types');
  const [prescriptionTypes, setPrescriptionTypes] = useState(initialPrescriptionTypes);
  const [lensTypes, setLensTypes] = useState(initialLensTypes);
  const [lensIndexes, setLensIndexes] = useState(initialLensIndexes);
  const [viewAreas, setViewAreas] = useState(initialViewAreas);
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'prescription_types' as TabType, label: 'Tipos de Prescripción', count: prescriptionTypes.length },
    { id: 'lens_types' as TabType, label: 'Tipos de Lentes', count: lensTypes.length },
    { id: 'lens_indexes' as TabType, label: 'Índices de Lentes', count: lensIndexes.length },
    { id: 'view_areas' as TabType, label: 'Áreas de Visión', count: viewAreas.length },
  ];

  const refreshData = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const [
      { data: newPrescriptionTypes },
      { data: newLensTypes },
      { data: newLensIndexes },
      { data: newViewAreas },
    ] = await Promise.all([
      supabase.from('prescription_types').select('*').order('display_order', { ascending: true }),
      supabase.from('lens_types').select('*').order('display_order', { ascending: true }),
      supabase.from('lens_indexes').select('*').order('display_order', { ascending: true }),
      supabase.from('view_areas').select('*').order('display_order', { ascending: true }),
    ]);

    if (newPrescriptionTypes) setPrescriptionTypes(newPrescriptionTypes);
    if (newLensTypes) setLensTypes(newLensTypes);
    if (newLensIndexes) setLensIndexes(newLensIndexes);
    if (newViewAreas) setViewAreas(newViewAreas);

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración de Prescripciones</h1>
        <p className="text-gray-600 mt-2">
          Gestiona los tipos de prescripción, lentes, índices y áreas de visión disponibles para los clientes.
        </p>
      </div>

      {/* Pricing Preview Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Vista Previa de Precios</CardTitle>
        </CardHeader>
        <CardContent>
          <PricingPreview
            lensTypes={lensTypes}
            lensIndexes={lensIndexes}
            viewAreas={viewAreas}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-600">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'prescription_types' && (
          <PrescriptionTypesTab
            data={prescriptionTypes}
            onRefresh={refreshData}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'lens_types' && (
          <LensTypesTab
            data={lensTypes}
            onRefresh={refreshData}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'lens_indexes' && (
          <LensIndexesTab
            data={lensIndexes}
            onRefresh={refreshData}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'view_areas' && (
          <ViewAreasTab
            data={viewAreas}
            onRefresh={refreshData}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PRESCRIPTION TYPES TAB
// ============================================================================

function PrescriptionTypesTab({
  data,
  onRefresh,
  isLoading,
}: {
  data: PrescriptionType[];
  onRefresh: () => void;
  isLoading: boolean;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_active: true,
    display_order: data.length,
  });
  const [editFormData, setEditFormData] = useState<Partial<PrescriptionType>>({});

  const handleAdd = async () => {
    if (!formData.name || !formData.slug) {
      alert('Por favor completa el nombre y slug');
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('prescription_types').insert([formData]);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    setIsAdding(false);
    setFormData({ name: '', slug: '', description: '', is_active: true, display_order: data.length + 1 });
    onRefresh();
  };

  const startEdit = (item: PrescriptionType) => {
    setEditingId(item.id);
    setEditFormData(item);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('prescription_types')
      .update({ ...editFormData, updated_at: new Date().toISOString() })
      .eq('id', editingId);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    setEditingId(null);
    setEditFormData({});
    onRefresh();
  };

  const handleUpdate = async (id: string, updates: Partial<PrescriptionType>) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('prescription_types')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    onRefresh();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('prescription_types').delete().eq('id', id);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    onRefresh();
  };

  const handleMoveUp = async (item: PrescriptionType, index: number) => {
    if (index === 0) return;
    const prevItem = data[index - 1];

    const supabase = createClient();
    await supabase.from('prescription_types').update({ display_order: prevItem.display_order }).eq('id', item.id);
    await supabase.from('prescription_types').update({ display_order: item.display_order }).eq('id', prevItem.id);

    onRefresh();
  };

  const handleMoveDown = async (item: PrescriptionType, index: number) => {
    if (index === data.length - 1) return;
    const nextItem = data[index + 1];

    const supabase = createClient();
    await supabase.from('prescription_types').update({ display_order: nextItem.display_order }).eq('id', item.id);
    await supabase.from('prescription_types').update({ display_order: item.display_order }).eq('id', nextItem.id);

    onRefresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tipos de Prescripción</CardTitle>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Tipo
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add Form */}
          {isAdding && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-green-900">Nuevo Tipo de Prescripción</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre (ej: Visión Sencilla)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Slug (ej: single-vision)"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="border rounded px-3 py-2"
                />
              </div>
              <textarea
                placeholder="Descripción (opcional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border rounded px-3 py-2 w-full"
                rows={2}
              />
              <div className="flex gap-2">
                <Button onClick={handleAdd} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
                <Button
                  onClick={() => setIsAdding(false)}
                  size="sm"
                  variant="outline"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* List */}
          {data.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay tipos de prescripción configurados</p>
          ) : (
            <div className="space-y-2">
              {data.map((item, index) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${
                    item.is_active ? 'bg-white' : 'bg-gray-100'
                  }`}
                >
                  {editingId === item.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editFormData.name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="border rounded px-3 py-2"
                          placeholder="Nombre"
                        />
                        <input
                          type="text"
                          value={editFormData.slug || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
                          className="border rounded px-3 py-2"
                          placeholder="Slug"
                        />
                      </div>
                      <textarea
                        value={editFormData.description || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        className="border rounded px-3 py-2 w-full"
                        placeholder="Descripción"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Check className="h-4 w-4 mr-2" />
                          Guardar
                        </Button>
                        <Button onClick={cancelEdit} size="sm" variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.slug}</span>
                          <button
                            onClick={() => handleUpdate(item.id, { is_active: !item.is_active })}
                            className={`text-xs px-3 py-1 rounded ${
                              item.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {item.is_active ? 'Activo' : 'Inactivo'}
                          </button>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => startEdit(item)} size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleMoveUp(item, index)}
                          size="sm"
                          variant="outline"
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleMoveDown(item, index)}
                          size="sm"
                          variant="outline"
                          disabled={index === data.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(item.id, item.name)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LENS TYPES TAB (with editing and new flags)
// ============================================================================

function LensTypesTab({
  data,
  onRefresh,
  isLoading,
}: {
  data: LensType[];
  onRefresh: () => void;
  isLoading: boolean;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price_modifier: 0,
    applies_to_without_rx: false,
    applies_to_single_vision: false,
    applies_to_progressive: false,
    is_active: true,
    display_order: data.length,
  });
  const [editFormData, setEditFormData] = useState<Partial<LensType>>({});

  const handleAdd = async () => {
    if (!formData.name || !formData.slug) {
      alert('Por favor completa el nombre y slug');
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('lens_types').insert([{
      ...formData,
      applies_to_with_rx: formData.applies_to_single_vision || formData.applies_to_progressive,
    }]);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    setIsAdding(false);
    setFormData({
      name: '',
      slug: '',
      description: '',
      price_modifier: 0,
      applies_to_without_rx: false,
      applies_to_single_vision: false,
      applies_to_progressive: false,
      is_active: true,
      display_order: data.length + 1,
    });
    onRefresh();
  };

  const startEdit = (item: LensType) => {
    setEditingId(item.id);
    setEditFormData(item);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('lens_types')
      .update({
        ...editFormData,
        applies_to_with_rx: editFormData.applies_to_single_vision || editFormData.applies_to_progressive,
        updated_at: new Date().toISOString()
      })
      .eq('id', editingId);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    setEditingId(null);
    setEditFormData({});
    onRefresh();
  };

  const handleUpdate = async (id: string, updates: Partial<LensType>) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('lens_types')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    onRefresh();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('lens_types').delete().eq('id', id);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    onRefresh();
  };

  const handleMoveUp = async (item: LensType, index: number) => {
    if (index === 0) return;
    const prevItem = data[index - 1];

    const supabase = createClient();
    await supabase.from('lens_types').update({ display_order: prevItem.display_order }).eq('id', item.id);
    await supabase.from('lens_types').update({ display_order: item.display_order }).eq('id', prevItem.id);

    onRefresh();
  };

  const handleMoveDown = async (item: LensType, index: number) => {
    if (index === data.length - 1) return;
    const nextItem = data[index + 1];

    const supabase = createClient();
    await supabase.from('lens_types').update({ display_order: nextItem.display_order }).eq('id', item.id);
    await supabase.from('lens_types').update({ display_order: item.display_order }).eq('id', nextItem.id);

    onRefresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tipos de Lentes</CardTitle>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Tipo de Lente
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add Form */}
          {isAdding && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-green-900">Nuevo Tipo de Lente</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre (ej: Blue Light Block)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Slug (ej: blue-light-block)"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="border rounded px-3 py-2"
                />
              </div>
              <textarea
                placeholder="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border rounded px-3 py-2 w-full"
                rows={2}
              />
              <div>
                <label className="block text-sm font-medium mb-1">Precio Adicional (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price_modifier}
                  onChange={(e) => setFormData({ ...formData, price_modifier: parseFloat(e.target.value) || 0 })}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={formData.applies_to_without_rx}
                    onChange={(e) => setFormData({ ...formData, applies_to_without_rx: e.target.checked })}
                    className="mr-2"
                  />
                  Sin Receta (Frame Only)
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={formData.applies_to_single_vision}
                    onChange={(e) => setFormData({ ...formData, applies_to_single_vision: e.target.checked })}
                    className="mr-2"
                  />
                  Visión Sencilla
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={formData.applies_to_progressive}
                    onChange={(e) => setFormData({ ...formData, applies_to_progressive: e.target.checked })}
                    className="mr-2"
                  />
                  Progresivo
                </label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
                <Button onClick={() => setIsAdding(false)} size="sm" variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* List */}
          {data.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay tipos de lentes configurados</p>
          ) : (
            <div className="space-y-2">
              {data.map((item, index) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${item.is_active ? 'bg-white' : 'bg-gray-100'}`}
                >
                  {editingId === item.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editFormData.name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="border rounded px-3 py-2"
                          placeholder="Nombre"
                        />
                        <input
                          type="text"
                          value={editFormData.slug || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
                          className="border rounded px-3 py-2"
                          placeholder="Slug"
                        />
                      </div>
                      <textarea
                        value={editFormData.description || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        className="border rounded px-3 py-2 w-full"
                        placeholder="Descripción"
                        rows={2}
                      />
                      <div>
                        <label className="block text-sm font-medium mb-1">Precio Adicional (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.price_modifier || 0}
                          onChange={(e) => setEditFormData({ ...editFormData, price_modifier: parseFloat(e.target.value) || 0 })}
                          className="border rounded px-3 py-2 w-full"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={editFormData.applies_to_without_rx || false}
                            onChange={(e) => setEditFormData({ ...editFormData, applies_to_without_rx: e.target.checked })}
                            className="mr-2"
                          />
                          Sin Receta
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={editFormData.applies_to_single_vision || false}
                            onChange={(e) => setEditFormData({ ...editFormData, applies_to_single_vision: e.target.checked })}
                            className="mr-2"
                          />
                          Visión Sencilla
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={editFormData.applies_to_progressive || false}
                            onChange={(e) => setEditFormData({ ...editFormData, applies_to_progressive: e.target.checked })}
                            className="mr-2"
                          />
                          Progresivo
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Check className="h-4 w-4 mr-2" />
                          Guardar
                        </Button>
                        <Button onClick={cancelEdit} size="sm" variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.slug}</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {item.price_modifier > 0 ? `+$${item.price_modifier.toFixed(2)}` : '$0.00'}
                          </span>
                          {item.applies_to_without_rx && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Sin Receta</span>
                          )}
                          {item.applies_to_single_vision && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Visión Sencilla</span>
                          )}
                          {item.applies_to_progressive && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Progresivo</span>
                          )}
                          <button
                            onClick={() => handleUpdate(item.id, { is_active: !item.is_active })}
                            className={`text-xs px-3 py-1 rounded ${
                              item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {item.is_active ? 'Activo' : 'Inactivo'}
                          </button>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => startEdit(item)} size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleMoveUp(item, index)} size="sm" variant="outline" disabled={index === 0}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleMoveDown(item, index)} size="sm" variant="outline" disabled={index === data.length - 1}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDelete(item.id, item.name)} size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LENS INDEXES TAB (with editing and new flags)
// ============================================================================

function LensIndexesTab({
  data,
  onRefresh,
  isLoading,
}: {
  data: LensIndex[];
  onRefresh: () => void;
  isLoading: boolean;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    index_value: '',
    description: '',
    price_modifier: 0,
    applies_to_single_vision: true,
    applies_to_progressive: true,
    is_active: true,
    display_order: data.length,
  });
  const [editFormData, setEditFormData] = useState<Partial<LensIndex>>({});

  const handleAdd = async () => {
    if (!formData.name || !formData.slug || !formData.index_value) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('lens_indexes').insert([formData]);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    setIsAdding(false);
    setFormData({
      name: '',
      slug: '',
      index_value: '',
      description: '',
      price_modifier: 0,
      applies_to_single_vision: true,
      applies_to_progressive: true,
      is_active: true,
      display_order: data.length + 1,
    });
    onRefresh();
  };

  const startEdit = (item: LensIndex) => {
    setEditingId(item.id);
    setEditFormData(item);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('lens_indexes')
      .update({ ...editFormData, updated_at: new Date().toISOString() })
      .eq('id', editingId);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    setEditingId(null);
    setEditFormData({});
    onRefresh();
  };

  const handleUpdate = async (id: string, updates: Partial<LensIndex>) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('lens_indexes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    onRefresh();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('lens_indexes').delete().eq('id', id);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    onRefresh();
  };

  const handleMoveUp = async (item: LensIndex, index: number) => {
    if (index === 0) return;
    const prevItem = data[index - 1];

    const supabase = createClient();
    await supabase.from('lens_indexes').update({ display_order: prevItem.display_order }).eq('id', item.id);
    await supabase.from('lens_indexes').update({ display_order: item.display_order }).eq('id', prevItem.id);

    onRefresh();
  };

  const handleMoveDown = async (item: LensIndex, index: number) => {
    if (index === data.length - 1) return;
    const nextItem = data[index + 1];

    const supabase = createClient();
    await supabase.from('lens_indexes').update({ display_order: nextItem.display_order }).eq('id', item.id);
    await supabase.from('lens_indexes').update({ display_order: item.display_order }).eq('id', nextItem.id);

    onRefresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Índices de Lentes</CardTitle>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Índice
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add Form */}
          {isAdding && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-green-900">Nuevo Índice de Lente</h3>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nombre (ej: High-Index 1.60)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Slug (ej: high-index-160)"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Valor (ej: 1.60)"
                  value={formData.index_value}
                  onChange={(e) => setFormData({ ...formData, index_value: e.target.value })}
                  className="border rounded px-3 py-2"
                />
              </div>
              <textarea
                placeholder="Descripción (ej: 20% más delgado y ligero)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border rounded px-3 py-2 w-full"
                rows={2}
              />
              <div>
                <label className="block text-sm font-medium mb-1">Precio Adicional (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price_modifier}
                  onChange={(e) => setFormData({ ...formData, price_modifier: parseFloat(e.target.value) || 0 })}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={formData.applies_to_single_vision}
                    onChange={(e) => setFormData({ ...formData, applies_to_single_vision: e.target.checked })}
                    className="mr-2"
                  />
                  Visión Sencilla
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={formData.applies_to_progressive}
                    onChange={(e) => setFormData({ ...formData, applies_to_progressive: e.target.checked })}
                    className="mr-2"
                  />
                  Progresivo
                </label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
                <Button onClick={() => setIsAdding(false)} size="sm" variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* List */}
          {data.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay índices de lentes configurados</p>
          ) : (
            <div className="space-y-2">
              {data.map((item, index) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${item.is_active ? 'bg-white' : 'bg-gray-100'}`}
                >
                  {editingId === item.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={editFormData.name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="border rounded px-3 py-2"
                          placeholder="Nombre"
                        />
                        <input
                          type="text"
                          value={editFormData.slug || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
                          className="border rounded px-3 py-2"
                          placeholder="Slug"
                        />
                        <input
                          type="text"
                          value={editFormData.index_value || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, index_value: e.target.value })}
                          className="border rounded px-3 py-2"
                          placeholder="Valor"
                        />
                      </div>
                      <textarea
                        value={editFormData.description || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        className="border rounded px-3 py-2 w-full"
                        placeholder="Descripción"
                        rows={2}
                      />
                      <div>
                        <label className="block text-sm font-medium mb-1">Precio Adicional (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.price_modifier || 0}
                          onChange={(e) => setEditFormData({ ...editFormData, price_modifier: parseFloat(e.target.value) || 0 })}
                          className="border rounded px-3 py-2 w-full"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={editFormData.applies_to_single_vision || false}
                            onChange={(e) => setEditFormData({ ...editFormData, applies_to_single_vision: e.target.checked })}
                            className="mr-2"
                          />
                          Visión Sencilla
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={editFormData.applies_to_progressive || false}
                            onChange={(e) => setEditFormData({ ...editFormData, applies_to_progressive: e.target.checked })}
                            className="mr-2"
                          />
                          Progresivo
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Check className="h-4 w-4 mr-2" />
                          Guardar
                        </Button>
                        <Button onClick={cancelEdit} size="sm" variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.index_value}</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {item.price_modifier > 0 ? `+$${item.price_modifier.toFixed(2)}` : 'GRATIS'}
                          </span>
                          {item.applies_to_single_vision && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Visión Sencilla</span>
                          )}
                          {item.applies_to_progressive && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Progresivo</span>
                          )}
                          <button
                            onClick={() => handleUpdate(item.id, { is_active: !item.is_active })}
                            className={`text-xs px-3 py-1 rounded ${
                              item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {item.is_active ? 'Activo' : 'Inactivo'}
                          </button>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => startEdit(item)} size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleMoveUp(item, index)} size="sm" variant="outline" disabled={index === 0}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleMoveDown(item, index)} size="sm" variant="outline" disabled={index === data.length - 1}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDelete(item.id, item.name)} size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// VIEW AREAS TAB (with editing)
// ============================================================================

function ViewAreasTab({
  data,
  onRefresh,
  isLoading,
}: {
  data: ViewArea[];
  onRefresh: () => void;
  isLoading: boolean;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price_modifier: 0,
    is_active: true,
    display_order: data.length,
  });
  const [editFormData, setEditFormData] = useState<Partial<ViewArea>>({});

  const handleAdd = async () => {
    if (!formData.name || !formData.slug) {
      alert('Por favor completa el nombre y slug');
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('view_areas').insert([formData]);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    setIsAdding(false);
    setFormData({
      name: '',
      slug: '',
      description: '',
      price_modifier: 0,
      is_active: true,
      display_order: data.length + 1,
    });
    onRefresh();
  };

  const startEdit = (item: ViewArea) => {
    setEditingId(item.id);
    setEditFormData(item);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('view_areas')
      .update({ ...editFormData, updated_at: new Date().toISOString() })
      .eq('id', editingId);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    setEditingId(null);
    setEditFormData({});
    onRefresh();
  };

  const handleUpdate = async (id: string, updates: Partial<ViewArea>) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('view_areas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    onRefresh();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('view_areas').delete().eq('id', id);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    onRefresh();
  };

  const handleMoveUp = async (item: ViewArea, index: number) => {
    if (index === 0) return;
    const prevItem = data[index - 1];

    const supabase = createClient();
    await supabase.from('view_areas').update({ display_order: prevItem.display_order }).eq('id', item.id);
    await supabase.from('view_areas').update({ display_order: item.display_order }).eq('id', prevItem.id);

    onRefresh();
  };

  const handleMoveDown = async (item: ViewArea, index: number) => {
    if (index === data.length - 1) return;
    const nextItem = data[index + 1];

    const supabase = createClient();
    await supabase.from('view_areas').update({ display_order: nextItem.display_order }).eq('id', item.id);
    await supabase.from('view_areas').update({ display_order: item.display_order }).eq('id', nextItem.id);

    onRefresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Áreas de Visión (Progresivos)</CardTitle>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Área de Visión
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add Form */}
          {isAdding && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-green-900">Nueva Área de Visión</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre (ej: 40% Más Amplio)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Slug (ej: broader-view-40)"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="border rounded px-3 py-2"
                />
              </div>
              <textarea
                placeholder="Descripción (ej: Zonas más amplias para trabajo en computadora)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border rounded px-3 py-2 w-full"
                rows={2}
              />
              <div>
                <label className="block text-sm font-medium mb-1">Precio Adicional (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price_modifier}
                  onChange={(e) => setFormData({ ...formData, price_modifier: parseFloat(e.target.value) || 0 })}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
                <Button onClick={() => setIsAdding(false)} size="sm" variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* List */}
          {data.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay áreas de visión configuradas</p>
          ) : (
            <div className="space-y-2">
              {data.map((item, index) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${item.is_active ? 'bg-white' : 'bg-gray-100'}`}
                >
                  {editingId === item.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editFormData.name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="border rounded px-3 py-2"
                          placeholder="Nombre"
                        />
                        <input
                          type="text"
                          value={editFormData.slug || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
                          className="border rounded px-3 py-2"
                          placeholder="Slug"
                        />
                      </div>
                      <textarea
                        value={editFormData.description || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        className="border rounded px-3 py-2 w-full"
                        placeholder="Descripción"
                        rows={2}
                      />
                      <div>
                        <label className="block text-sm font-medium mb-1">Precio Adicional (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.price_modifier || 0}
                          onChange={(e) => setEditFormData({ ...editFormData, price_modifier: parseFloat(e.target.value) || 0 })}
                          className="border rounded px-3 py-2 w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Check className="h-4 w-4 mr-2" />
                          Guardar
                        </Button>
                        <Button onClick={cancelEdit} size="sm" variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.slug}</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {item.price_modifier > 0 ? `+$${item.price_modifier.toFixed(2)}` : 'GRATIS'}
                          </span>
                          <button
                            onClick={() => handleUpdate(item.id, { is_active: !item.is_active })}
                            className={`text-xs px-3 py-1 rounded ${
                              item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {item.is_active ? 'Activo' : 'Inactivo'}
                          </button>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => startEdit(item)} size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleMoveUp(item, index)} size="sm" variant="outline" disabled={index === 0}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleMoveDown(item, index)} size="sm" variant="outline" disabled={index === data.length - 1}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDelete(item.id, item.name)} size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PRICING PREVIEW COMPONENT
// ============================================================================

function PricingPreview({
  lensTypes,
  lensIndexes,
  viewAreas,
}: {
  lensTypes: LensType[];
  lensIndexes: LensIndex[];
  viewAreas: ViewArea[];
}) {
  const basePrice = 100; // Example base price
  const activeLensTypes = lensTypes.filter((lt) => lt.is_active);
  const activeLensIndexes = lensIndexes.filter((li) => li.is_active);
  const activeViewAreas = viewAreas.filter((va) => va.is_active);

  return (
    <div className="space-y-3">
      <p className="text-sm text-blue-800">
        Precios de ejemplo para un producto de <strong>$100.00</strong>:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Frame Only Example */}
        <div className="bg-white rounded p-3 border border-blue-200">
          <h4 className="font-semibold mb-2">🔵 Solo Marco (Sin RX)</h4>
          {activeLensTypes.filter(lt => lt.applies_to_without_rx).slice(0, 2).map(lt => (
            <div key={lt.id} className="flex justify-between text-xs py-1">
              <span>{lt.name}</span>
              <span className="font-semibold">
                ${(basePrice + lt.price_modifier).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Single Vision Example */}
        <div className="bg-white rounded p-3 border border-blue-200">
          <h4 className="font-semibold mb-2">🔵 Visión Sencilla + Índice</h4>
          {activeLensTypes.filter(lt => lt.applies_to_single_vision).slice(0, 1).map(lt => (
            activeLensIndexes.filter(li => li.applies_to_single_vision).slice(0, 2).map(li => (
              <div key={`${lt.id}-${li.id}`} className="flex justify-between text-xs py-1">
                <span>{lt.name} + {li.name}</span>
                <span className="font-semibold">
                  ${(basePrice + lt.price_modifier + li.price_modifier).toFixed(2)}
                </span>
              </div>
            ))
          ))}
        </div>

        {/* Progressive Example */}
        <div className="bg-white rounded p-3 border border-blue-200">
          <h4 className="font-semibold mb-2">🔵 Progresivo + Área Vista</h4>
          {activeViewAreas.slice(0, 2).map(va => (
            <div key={va.id} className="flex justify-between text-xs py-1">
              <span>Progresivo + {va.name}</span>
              <span className="font-semibold">
                ${(basePrice + (activeLensTypes.find(lt => lt.applies_to_progressive)?.price_modifier || 0) + (activeLensIndexes.find(li => li.applies_to_progressive)?.price_modifier || 0) + va.price_modifier).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Most Expensive Example */}
        <div className="bg-white rounded p-3 border border-blue-200">
          <h4 className="font-semibold mb-2">🔵 Configuración Máxima</h4>
          <div className="flex justify-between text-xs py-1">
            <span>Base</span>
            <span>${basePrice.toFixed(2)}</span>
          </div>
          {activeLensTypes.filter(lt => lt.applies_to_progressive).slice(0, 1).map(lt => (
            <div key={lt.id} className="flex justify-between text-xs py-1">
              <span>+ {lt.name}</span>
              <span>+${lt.price_modifier.toFixed(2)}</span>
            </div>
          ))}
          {activeLensIndexes.filter(li => li.price_modifier > 0 && li.applies_to_progressive).slice(-1).map(li => (
            <div key={li.id} className="flex justify-between text-xs py-1">
              <span>+ {li.name}</span>
              <span>+${li.price_modifier.toFixed(2)}</span>
            </div>
          ))}
          {activeViewAreas.filter(va => va.price_modifier > 0).slice(-1).map(va => (
            <div key={va.id} className="flex justify-between text-xs py-1">
              <span>+ {va.name}</span>
              <span>+${va.price_modifier.toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-300 mt-1 pt-1 flex justify-between font-semibold">
            <span>Total</span>
            <span>
              ${(
                basePrice +
                (activeLensTypes.find(lt => lt.applies_to_progressive)?.price_modifier || 0) +
                (activeLensIndexes.filter(li => li.price_modifier > 0 && li.applies_to_progressive).slice(-1)[0]?.price_modifier || 0) +
                (activeViewAreas.filter(va => va.price_modifier > 0).slice(-1)[0]?.price_modifier || 0)
              ).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
