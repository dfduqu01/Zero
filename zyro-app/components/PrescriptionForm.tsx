'use client';

import { useState, useEffect } from 'react';
import type {
  PrescriptionData,
  PrescriptionType,
  LensType,
  LensIndex,
  ViewArea,
  PrescriptionFormula,
} from '@/lib/types/prescription';
import {
  groupLensTypes,
  getActiveLensIndexes,
  getActiveViewAreas,
  compressPrescriptionImage,
} from '@/lib/utils/prescription-helpers';

interface PrescriptionFormProps {
  value: PrescriptionData | undefined;
  onChange: (prescription: PrescriptionData | undefined) => void;
  prescriptionTypes: PrescriptionType[];
  lensTypes: LensType[];
  lensIndexes: LensIndex[];
  viewAreas: ViewArea[];
  onAddToCart?: () => void; // Callback when prescription is complete
  onFormStateChange?: (isActive: boolean) => void; // Callback when form opens/closes
}

type FlowStep = 'initial' | 'prescription_type' | 'formula' | 'lens_type' | 'lens_index' | 'view_area';

export default function PrescriptionForm({
  value,
  onChange,
  prescriptionTypes,
  lensTypes,
  lensIndexes,
  viewAreas,
  onAddToCart,
  onFormStateChange,
}: PrescriptionFormProps) {
  const [enabled, setEnabled] = useState<boolean>(!!value);
  const [currentStep, setCurrentStep] = useState<FlowStep>('initial');
  const [flow, setFlow] = useState<'frame_only' | 'add_prescription' | null>(null);

  // Form state
  const [prescriptionTypeId, setPrescriptionTypeId] = useState<string | null>(
    value?.prescription_type_id || null
  );
  const [lensTypeId, setLensTypeId] = useState<string | null>(value?.lens_type_id || null);
  const [lensIndexId, setLensIndexId] = useState<string | null>(value?.lens_index_id || null);
  const [viewAreaId, setViewAreaId] = useState<string | null>(value?.view_area_id || null);
  const [formula, setFormula] = useState<PrescriptionFormula>(value?.formula || {});
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    value?.prescription_image_url
  );

  // Get selected objects
  const selectedPrescriptionType = prescriptionTypes.find((pt) => pt.id === prescriptionTypeId);

  // Filter lens types and indexes based on prescription type
  const grouped = groupLensTypes(lensTypes, selectedPrescriptionType?.slug);
  const activeLensIndexes = getActiveLensIndexes(lensIndexes, selectedPrescriptionType?.slug);
  const activeViewAreas = getActiveViewAreas(viewAreas);
  const selectedLensType = lensTypes.find((lt) => lt.id === lensTypeId);
  const selectedLensIndex = lensIndexes.find((li) => li.id === lensIndexId);
  const selectedViewArea = viewAreas.find((va) => va.id === viewAreaId);

  // Update parent when values change
  useEffect(() => {
    if (!enabled) {
      onChange(undefined);
      return;
    }

    const prescription: PrescriptionData = {
      prescription_type_id: prescriptionTypeId,
      lens_type_id: lensTypeId,
      lens_index_id: lensIndexId,
      view_area_id: viewAreaId,
      formula: Object.keys(formula).length > 0 ? formula : undefined,
      prescription_image_file: imageFile,
      prescription_image_url: imagePreview,
    };

    onChange(prescription);
  }, [enabled, prescriptionTypeId, lensTypeId, lensIndexId, viewAreaId, formula, imageFile, imagePreview]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor selecciona un archivo JPG, PNG, WebP o PDF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 5MB');
      return;
    }

    try {
      if (file.type.startsWith('image/')) {
        const { base64 } = await compressPrescriptionImage(file);
        setImagePreview(base64);
        setImageFile(file);
      } else {
        setImagePreview(URL.createObjectURL(file));
        setImageFile(file);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error al procesar la imagen');
    }
  };

  // Reset form
  const handleReset = () => {
    setEnabled(false);
    setCurrentStep('initial');
    setFlow(null);
    setPrescriptionTypeId(null);
    setLensTypeId(null);
    setLensIndexId(null);
    setViewAreaId(null);
    setFormula({});
    setImageFile(undefined);
    setImagePreview(undefined);
    onFormStateChange?.(false); // Notify parent form is closed
  };

  // Handle add to cart from complete button
  const handleComplete = () => {
    if (onAddToCart) {
      onAddToCart();
    }
  };

  // Step 1: Initial choice - Two buttons
  if (!enabled) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900 mb-2">¿Cómo deseas tus gafas?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setEnabled(true);
              setFlow('add_prescription');
              setCurrentStep('prescription_type');
              onFormStateChange?.(true); // Notify parent form is open
            }}
            className="py-4 px-4 border-2 border-gray-300 rounded-lg hover:border-black hover:bg-gray-50 transition-all text-center"
          >
            <div className="text-2xl mb-2">👓</div>
            <div className="font-semibold text-gray-900">Seleccionar Lentes</div>
            <div className="text-xs text-gray-600 mt-1">Con receta médica</div>
          </button>
          <button
            onClick={() => {
              setEnabled(true);
              setFlow('frame_only');
              setCurrentStep('lens_type');
              // Set to Non-Prescription type
              const nonRxType = prescriptionTypes.find((pt) => pt.slug === 'non-prescription');
              if (nonRxType) {
                setPrescriptionTypeId(nonRxType.id);
              }
              onFormStateChange?.(true); // Notify parent form is open
            }}
            className="py-4 px-4 border-2 border-gray-300 rounded-lg hover:border-black hover:bg-gray-50 transition-all text-center"
          >
            <div className="text-2xl mb-2">🖼️</div>
            <div className="font-semibold text-gray-900">Solo el Marco</div>
            <div className="text-xs text-gray-600 mt-1">Sin lentes graduados</div>
          </button>
        </div>
      </div>
    );
  }

  // Initial: Frame Only or Add Prescription
  if (currentStep === 'initial') {
    return (
      <div className="space-y-4 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Configuración de Lentes</h3>
          <button onClick={handleReset} className="text-sm text-red-600 hover:text-red-700">
            Quitar
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-600">Selecciona una opción:</p>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => {
                setFlow('frame_only');
                setCurrentStep('lens_type');
                // Set to Non-Prescription type
                const nonRxType = prescriptionTypes.find((pt) => pt.slug === 'non-prescription');
                if (nonRxType) {
                  setPrescriptionTypeId(nonRxType.id);
                }
              }}
              className="p-4 border-2 border-gray-300 rounded-lg text-left hover:border-black hover:bg-white transition-all"
            >
              <div className="font-semibold text-gray-900">Solo el Marco (Frame Only)</div>
              <div className="text-sm text-gray-600 mt-1">
                Sin receta o lentes de protección
              </div>
            </button>

            <button
              onClick={() => {
                setFlow('add_prescription');
                setCurrentStep('prescription_type');
              }}
              className="p-4 border-2 border-gray-300 rounded-lg text-left hover:border-black hover:bg-white transition-all"
            >
              <div className="font-semibold text-gray-900">Agregar Lentes con Receta</div>
              <div className="text-sm text-gray-600 mt-1">
                Lentes graduados según tu prescripción
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Prescription Type (Single Vision, Progressive, Non-Prescription)
  if (currentStep === 'prescription_type' && flow === 'add_prescription') {
    return (
      <div className="space-y-4 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep('initial')}
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Atrás
          </button>
          <button onClick={handleReset} className="text-sm text-red-600 hover:text-red-700">
            X
          </button>
        </div>

        <h3 className="text-lg font-semibold text-gray-900">Tipo de Prescripción</h3>

        <div className="space-y-3">
          {prescriptionTypes
            .filter((pt) => pt.is_active)
            .sort((a, b) => a.display_order - b.display_order)
            .map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setPrescriptionTypeId(type.id);
                  // If Non-Prescription, redirect to lens type (Frame Only flow)
                  if (type.slug === 'non-prescription') {
                    setFlow('frame_only');
                    setCurrentStep('lens_type');
                  } else {
                    setCurrentStep('formula');
                  }
                }}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  prescriptionTypeId === type.id
                    ? 'border-black bg-white'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-white'
                }`}
              >
                <div className="font-semibold text-gray-900">{type.name}</div>
                {type.description && (
                  <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                )}
              </button>
            ))}
        </div>
      </div>
    );
  }

  // Step 3: Formula Entry (for Single Vision & Progressive)
  if (currentStep === 'formula' && selectedPrescriptionType?.slug !== 'non-prescription') {
    return (
      <div className="space-y-4 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep('prescription_type')}
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Atrás
          </button>
          <button onClick={handleReset} className="text-sm text-red-600 hover:text-red-700">
            X
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900">Ingresa tu Prescripción</h3>
          <p className="text-sm text-gray-600 mt-1">
            Tipo: {selectedPrescriptionType?.name}
          </p>
        </div>

        {/* Formula Fields */}
        <div className="space-y-4 bg-white rounded-lg p-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Ojo Derecho (OD)</p>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-xs text-gray-500">SPH</label>
                <input
                  type="number"
                  step="0.25"
                  placeholder="-0.50"
                  value={formula.od_sph || ''}
                  onChange={(e) =>
                    setFormula({ ...formula, od_sph: parseFloat(e.target.value) || undefined })
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">CYL</label>
                <input
                  type="number"
                  step="0.25"
                  placeholder="-0.50"
                  value={formula.od_cyl || ''}
                  onChange={(e) =>
                    setFormula({ ...formula, od_cyl: parseFloat(e.target.value) || undefined })
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">AXIS</label>
                <input
                  type="number"
                  placeholder="22"
                  value={formula.od_axis || ''}
                  onChange={(e) =>
                    setFormula({ ...formula, od_axis: parseInt(e.target.value) || undefined })
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              {selectedPrescriptionType?.slug === 'progressive' && (
                <div>
                  <label className="text-xs text-gray-500">ADD</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="+1.50"
                    value={formula.add_value || ''}
                    onChange={(e) =>
                      setFormula({ ...formula, add_value: parseFloat(e.target.value) || undefined })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Ojo Izquierdo (OS)</p>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-xs text-gray-500">SPH</label>
                <input
                  type="number"
                  step="0.25"
                  placeholder="-0.50"
                  value={formula.os_sph || ''}
                  onChange={(e) =>
                    setFormula({ ...formula, os_sph: parseFloat(e.target.value) || undefined })
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">CYL</label>
                <input
                  type="number"
                  step="0.25"
                  placeholder="-0.50"
                  value={formula.os_cyl || ''}
                  onChange={(e) =>
                    setFormula({ ...formula, os_cyl: parseFloat(e.target.value) || undefined })
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">AXIS</label>
                <input
                  type="number"
                  placeholder="4"
                  value={formula.os_axis || ''}
                  onChange={(e) =>
                    setFormula({ ...formula, os_axis: parseInt(e.target.value) || undefined })
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              {selectedPrescriptionType?.slug === 'progressive' && (
                <div>
                  <label className="text-xs text-gray-500">ADD</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="+1.50"
                    value={formula.add_value || ''}
                    onChange={(e) =>
                      setFormula({ ...formula, add_value: parseFloat(e.target.value) || undefined })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Distancia Pupilar (PD)</p>
            <input
              type="number"
              step="0.5"
              placeholder="55.50"
              value={formula.pd || ''}
              onChange={(e) =>
                setFormula({ ...formula, pd: parseFloat(e.target.value) || undefined })
              }
              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Image Upload Alternative */}
        <div className="space-y-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">O sube una imagen de tu receta</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 mt-2"
            />
          </label>
          {imagePreview && (
            <div className="relative w-32 h-32 border border-gray-300 rounded">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded" />
            </div>
          )}
        </div>

        <button
          onClick={() => setCurrentStep('lens_type')}
          className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Siguiente
        </button>
      </div>
    );
  }

  // Step 4: Lens Type
  if (currentStep === 'lens_type') {
    const availableLensTypes = flow === 'frame_only' ? grouped.frame_only : grouped.prescription;

    return (
      <div className="space-y-4 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (flow === 'frame_only') {
                setCurrentStep('initial');
              } else {
                setCurrentStep('formula');
              }
            }}
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Atrás
          </button>
          <button onClick={handleReset} className="text-sm text-red-600 hover:text-red-700">
            X
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tipo de Lente</h3>
          {selectedPrescriptionType && (
            <p className="text-sm text-gray-600 mt-1">
              Prescripción: {selectedPrescriptionType.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          {availableLensTypes.map((lensType) => (
            <label
              key={lensType.id}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors ${
                lensTypeId === lensType.id ? 'border-black bg-white' : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="lens_type"
                checked={lensTypeId === lensType.id}
                onChange={() => setLensTypeId(lensType.id)}
                className="w-5 h-5 mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{lensType.name}</span>
                  {lensType.price_modifier > 0 && (
                    <span className="text-sm font-bold text-gray-900">
                      +${lensType.price_modifier.toFixed(2)}
                    </span>
                  )}
                </div>
                {lensType.description && (
                  <p className="text-sm text-gray-600 mt-1">{lensType.description}</p>
                )}
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={() => {
            // If frame only, we're done - add to cart
            if (flow === 'frame_only') {
              handleComplete();
              return;
            }
            // Otherwise go to lens index
            setCurrentStep('lens_index');
          }}
          disabled={!lensTypeId}
          className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {flow === 'frame_only' ? 'Agregar al Carrito' : 'Siguiente'}
        </button>
      </div>
    );
  }

  // Step 5: Lens Index (for prescription types only)
  if (currentStep === 'lens_index' && flow === 'add_prescription') {
    return (
      <div className="space-y-4 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep('lens_type')}
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Atrás
          </button>
          <button onClick={handleReset} className="text-sm text-red-600 hover:text-red-700">
            X
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900">Índice de Lente</h3>
          <p className="text-sm text-gray-600 mt-1">
            Prescripción: {selectedPrescriptionType?.name}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            * Todos los lentes incluyen anti-reflejante y resistencia a rayones
          </p>
        </div>

        <div className="space-y-2">
          {activeLensIndexes.map((lensIndex) => (
            <label
              key={lensIndex.id}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors ${
                lensIndexId === lensIndex.id ? 'border-black bg-white' : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="lens_index"
                checked={lensIndexId === lensIndex.id}
                onChange={() => setLensIndexId(lensIndex.id)}
                className="w-5 h-5 mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{lensIndex.name}</span>
                  {lensIndex.price_modifier > 0 && (
                    <span className="text-sm font-bold text-gray-900">
                      +${lensIndex.price_modifier.toFixed(2)}
                    </span>
                  )}
                </div>
                {lensIndex.description && (
                  <p className="text-sm text-gray-600 mt-1">{lensIndex.description}</p>
                )}
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={() => {
            // If Progressive, go to view area. Otherwise, we're done
            if (selectedPrescriptionType?.slug === 'progressive') {
              setCurrentStep('view_area');
            } else {
              // Form is complete - add to cart
              handleComplete();
            }
          }}
          disabled={!lensIndexId}
          className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {selectedPrescriptionType?.slug === 'progressive' ? 'Siguiente' : 'Agregar al Carrito'}
        </button>
      </div>
    );
  }

  // Step 6: View Area (for progressive only)
  if (currentStep === 'view_area' && selectedPrescriptionType?.slug === 'progressive') {
    return (
      <div className="space-y-4 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep('lens_index')}
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Atrás
          </button>
          <button onClick={handleReset} className="text-sm text-red-600 hover:text-red-700">
            X
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900">Área de Visión</h3>
          <p className="text-sm text-gray-600 mt-1">
            Prescripción: {selectedPrescriptionType?.name}
          </p>
        </div>

        <div className="space-y-2">
          {activeViewAreas.map((viewArea) => (
            <label
              key={viewArea.id}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors ${
                viewAreaId === viewArea.id ? 'border-black bg-white' : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="view_area"
                checked={viewAreaId === viewArea.id}
                onChange={() => setViewAreaId(viewArea.id)}
                className="w-5 h-5 mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{viewArea.name}</span>
                  {viewArea.price_modifier > 0 ? (
                    <span className="text-sm font-bold text-gray-900">
                      +${viewArea.price_modifier.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-green-600">GRATIS</span>
                  )}
                </div>
                {viewArea.description && (
                  <p className="text-sm text-gray-600 mt-1">{viewArea.description}</p>
                )}
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={handleComplete}
          disabled={!viewAreaId}
          className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Agregar al Carrito
        </button>
      </div>
    );
  }

  return null;
}
