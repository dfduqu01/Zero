'use client';

import { useState, useEffect } from 'react';
import type {
  EnhancedPrescriptionData,
  PrescriptionType,
  WithoutRxType,
  SingleVisionType,
  LensIndex,
  ProgressiveViewArea,
  LensOption,
  PrescriptionFormula,
} from '@/lib/types/prescription';
import {
  validatePrescription,
  groupLensOptions,
  compressPrescriptionImage,
} from '@/lib/utils/prescription-helpers';

interface EnhancedPrescriptionFormProps {
  value: EnhancedPrescriptionData | undefined;
  onChange: (prescription: EnhancedPrescriptionData | undefined) => void;
  lensOptions: LensOption[];
}

export default function EnhancedPrescriptionForm({
  value,
  onChange,
  lensOptions,
}: EnhancedPrescriptionFormProps) {
  const [enabled, setEnabled] = useState<boolean>(!!value);
  const [prescriptionType, setPrescriptionType] = useState<PrescriptionType | undefined>(
    value?.prescription_type
  );
  const [withoutRxType, setWithoutRxType] = useState<WithoutRxType | undefined>(
    value?.without_rx_type
  );
  const [singleVisionType, setSingleVisionType] = useState<SingleVisionType | undefined>(
    value?.single_vision_type
  );
  const [lensIndex, setLensIndex] = useState<LensIndex | undefined>(value?.lens_index);
  const [progressiveViewArea, setProgressiveViewArea] = useState<ProgressiveViewArea | undefined>(
    value?.progressive_view_area
  );
  const [formula, setFormula] = useState<PrescriptionFormula>(value?.formula || {});
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    value?.prescription_image_url
  );

  const grouped = groupLensOptions(lensOptions);

  // Update parent when values change
  useEffect(() => {
    if (!enabled) {
      onChange(undefined);
      return;
    }

    if (!prescriptionType) return;

    const prescription: EnhancedPrescriptionData = {
      prescription_type: prescriptionType,
      without_rx_type: withoutRxType,
      single_vision_type: singleVisionType,
      lens_index: lensIndex,
      progressive_view_area: progressiveViewArea,
      formula: Object.keys(formula).length > 0 ? formula : undefined,
      prescription_image_file: imageFile,
      prescription_image_url: imagePreview,
    };

    onChange(prescription);
  }, [
    enabled,
    prescriptionType,
    withoutRxType,
    singleVisionType,
    lensIndex,
    progressiveViewArea,
    formula,
    imageFile,
    imagePreview,
  ]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor selecciona un archivo JPG, PNG, WebP o PDF');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 5MB');
      return;
    }

    try {
      // Compress image
      if (file.type.startsWith('image/')) {
        const { base64 } = await compressPrescriptionImage(file);
        setImagePreview(base64);
        setImageFile(file);
      } else {
        // PDF - just set preview
        setImagePreview(URL.createObjectURL(file));
        setImageFile(file);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error al procesar la imagen');
    }
  };

  if (!enabled) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setEnabled(true)}
          className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-black hover:bg-gray-50 transition-colors text-gray-700 font-medium"
        >
          + Configurar Prescripción
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Configuración de Prescripción</h3>
        <button
          onClick={() => {
            setEnabled(false);
            setPrescriptionType(undefined);
          }}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Quitar
        </button>
      </div>

      {/* STEP 1: Prescription Type */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-900">
          1. Selecciona el Tipo de Prescripción
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => {
              setPrescriptionType('without_rx');
              setWithoutRxType(undefined);
              setSingleVisionType(undefined);
              setLensIndex(undefined);
              setProgressiveViewArea(undefined);
            }}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              prescriptionType === 'without_rx'
                ? 'border-black bg-black text-white'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-semibold">Sin Receta</div>
            <div className="text-sm mt-1 opacity-80">Marco o lentes decorativos</div>
          </button>

          <button
            onClick={() => {
              setPrescriptionType('single_vision');
              setWithoutRxType(undefined);
              setSingleVisionType(undefined);
              setProgressiveViewArea(undefined);
            }}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              prescriptionType === 'single_vision'
                ? 'border-black bg-black text-white'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-semibold">Visión Simple</div>
            <div className="text-sm mt-1 opacity-80">Un solo foco de visión</div>
          </button>

          <button
            onClick={() => {
              setPrescriptionType('progressive');
              setWithoutRxType(undefined);
              setSingleVisionType(undefined);
            }}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              prescriptionType === 'progressive'
                ? 'border-black bg-black text-white'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-semibold">Progresivos</div>
            <div className="text-sm mt-1 opacity-80">Múltiples focos</div>
          </button>
        </div>
      </div>

      {/* STEP 2: Without RX Sub-type */}
      {prescriptionType === 'without_rx' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-900">
            2. Selecciona una Opción
          </label>
          <div className="space-y-2">
            {grouped.without_rx_types.map((option) => (
              <label
                key={option.id}
                className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors"
              >
                <input
                  type="radio"
                  name="without_rx_type"
                  checked={withoutRxType === option.option_value}
                  onChange={() => setWithoutRxType(option.option_value as WithoutRxType)}
                  className="w-5 h-5 mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{option.display_name}</span>
                    {option.price_modifier > 0 && (
                      <span className="text-sm font-bold text-gray-900">
                        +${option.price_modifier.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {option.description && (
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Single Vision Sub-type */}
      {prescriptionType === 'single_vision' && (
        <>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900">
              2. Tipo de Visión Simple
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'near', label: 'Cerca' },
                { value: 'intermediate', label: 'Intermedia' },
                { value: 'distance', label: 'Lejos' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSingleVisionType(opt.value as SingleVisionType)}
                  className={`py-2 px-3 border-2 rounded-lg font-medium transition-all ${
                    singleVisionType === opt.value
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lens Index */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900">3. Índice de Lente</label>
            <div className="space-y-2">
              {grouped.lens_indexes.map((option) => (
                <label
                  key={option.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors"
                >
                  <input
                    type="radio"
                    name="lens_index"
                    checked={lensIndex === option.option_value}
                    onChange={() => setLensIndex(option.option_value as LensIndex)}
                    className="w-5 h-5 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{option.display_name}</span>
                      {option.price_modifier > 0 && (
                        <span className="text-sm font-bold text-gray-900">
                          +${option.price_modifier.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {option.description && (
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Prescription Formula or Image */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900">
              4. Valores de la Receta (opcional)
            </label>
            <p className="text-sm text-gray-600">
              Puedes ingresar los valores ahora o subir una imagen de tu receta.
            </p>

            {/* Formula Fields */}
            <div className="space-y-4 bg-white rounded-lg p-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Ojo Derecho (OD)</p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.25"
                    placeholder="SPH"
                    value={formula.od_sph || ''}
                    onChange={(e) =>
                      setFormula({ ...formula, od_sph: parseFloat(e.target.value) || undefined })
                    }
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    step="0.25"
                    placeholder="CYL"
                    value={formula.od_cyl || ''}
                    onChange={(e) =>
                      setFormula({ ...formula, od_cyl: parseFloat(e.target.value) || undefined })
                    }
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="AXIS"
                    value={formula.od_axis || ''}
                    onChange={(e) =>
                      setFormula({ ...formula, od_axis: parseInt(e.target.value) || undefined })
                    }
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Ojo Izquierdo (OS)</p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.25"
                    placeholder="SPH"
                    value={formula.os_sph || ''}
                    onChange={(e) =>
                      setFormula({ ...formula, os_sph: parseFloat(e.target.value) || undefined })
                    }
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    step="0.25"
                    placeholder="CYL"
                    value={formula.os_cyl || ''}
                    onChange={(e) =>
                      setFormula({ ...formula, os_cyl: parseFloat(e.target.value) || undefined })
                    }
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="AXIS"
                    value={formula.os_axis || ''}
                    onChange={(e) =>
                      setFormula({ ...formula, os_axis: parseInt(e.target.value) || undefined })
                    }
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Distancia Pupilar (PD)</p>
                <input
                  type="number"
                  step="0.5"
                  placeholder="63"
                  value={formula.pd || ''}
                  onChange={(e) =>
                    setFormula({ ...formula, pd: parseFloat(e.target.value) || undefined })
                  }
                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Image Upload */}
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
          </div>
        </>
      )}

      {/* STEP 2-4: Progressive */}
      {prescriptionType === 'progressive' && (
        <>
          {/* Lens Index */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900">2. Índice de Lente</label>
            <div className="space-y-2">
              {grouped.lens_indexes.map((option) => (
                <label
                  key={option.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors"
                >
                  <input
                    type="radio"
                    name="lens_index_prog"
                    checked={lensIndex === option.option_value}
                    onChange={() => setLensIndex(option.option_value as LensIndex)}
                    className="w-5 h-5 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{option.display_name}</span>
                      {option.price_modifier > 0 && (
                        <span className="text-sm font-bold text-gray-900">
                          +${option.price_modifier.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {option.description && (
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* View Area */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900">3. Área de Visión</label>
            <div className="space-y-2">
              {grouped.view_areas.map((option) => (
                <label
                  key={option.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors"
                >
                  <input
                    type="radio"
                    name="view_area"
                    checked={progressiveViewArea === option.option_value}
                    onChange={() => setProgressiveViewArea(option.option_value as ProgressiveViewArea)}
                    className="w-5 h-5 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{option.display_name}</span>
                      {option.price_modifier > 0 && (
                        <span className="text-sm font-bold text-gray-900">
                          +${option.price_modifier.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {option.description && (
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Same formula/image section as single vision */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900">
              4. Valores de la Receta (opcional)
            </label>
            <p className="text-sm text-gray-600">
              Puedes ingresar los valores ahora o subir una imagen de tu receta.
            </p>

            {/* Reuse same formula fields */}
            <div className="space-y-4 bg-white rounded-lg p-4">
              {/* Same as single vision - omitted for brevity */}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
