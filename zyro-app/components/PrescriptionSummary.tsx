'use client';

import type {
  PrescriptionData,
  PrescriptionType,
  LensType,
  LensIndex,
  ViewArea,
} from '@/lib/types/prescription';
import { formatPrescriptionFormula } from '@/lib/utils/prescription-helpers';

interface PrescriptionSummaryProps {
  prescription: PrescriptionData;
  prescriptionTypes?: PrescriptionType[];
  lensTypes?: LensType[];
  lensIndexes?: LensIndex[];
  viewAreas?: ViewArea[];
  compact?: boolean;
}

export default function PrescriptionSummary({
  prescription,
  prescriptionTypes = [],
  lensTypes = [],
  lensIndexes = [],
  viewAreas = [],
  compact = false,
}: PrescriptionSummaryProps) {
  if (!prescription) return null;

  // Get full objects from IDs
  const prescriptionType = prescriptionTypes.find((pt) => pt.id === prescription.prescription_type_id);
  const lensType = lensTypes.find((lt) => lt.id === prescription.lens_type_id);
  const lensIndex = lensIndexes.find((li) => li.id === prescription.lens_index_id);
  const viewArea = viewAreas.find((va) => va.id === prescription.view_area_id);

  const isNonPrescription = prescriptionType?.slug === 'non-prescription';
  const isSingleVision = prescriptionType?.slug === 'single-vision';
  const isProgressive = prescriptionType?.slug === 'progressive';

  return (
    <div className={`${compact ? 'text-xs' : 'text-sm'} space-y-2`}>
      {/* Prescription Type */}
      {prescriptionType && (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
              isNonPrescription
                ? 'bg-gray-100 text-gray-800'
                : isSingleVision
                ? 'bg-blue-100 text-blue-800'
                : 'bg-purple-100 text-purple-800'
            }`}
          >
            {prescriptionType.name}
          </span>
        </div>
      )}

      {/* Lens Type */}
      {lensType && (
        <div className="pl-2 border-l-2 border-gray-200">
          <p className="text-gray-700">
            <span className="font-medium">Tipo de Lente:</span> {lensType.name}
            {lensType.price_modifier > 0 && (
              <span className="text-sm text-gray-500 ml-1">(+${lensType.price_modifier.toFixed(2)})</span>
            )}
          </p>
        </div>
      )}

      {/* Lens Index (for RX types) */}
      {lensIndex && !isNonPrescription && (
        <div className="pl-2 border-l-2 border-blue-200">
          <p className="text-gray-700">
            <span className="font-medium">Índice de Lente:</span> {lensIndex.name}
            {lensIndex.price_modifier > 0 && (
              <span className="text-sm text-gray-500 ml-1">(+${lensIndex.price_modifier.toFixed(2)})</span>
            )}
          </p>
        </div>
      )}

      {/* View Area (for Progressive) */}
      {viewArea && isProgressive && (
        <div className="pl-2 border-l-2 border-purple-200">
          <p className="text-gray-700">
            <span className="font-medium">Área de Visión:</span> {viewArea.name}
            {viewArea.price_modifier > 0 && (
              <span className="text-sm text-gray-500 ml-1">(+${viewArea.price_modifier.toFixed(2)})</span>
            )}
          </p>
        </div>
      )}

      {/* Formula (for RX types) */}
      {!isNonPrescription && prescription.formula && Object.keys(prescription.formula).length > 0 && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
          <p className="font-medium text-gray-700 mb-1">Fórmula de Prescripción:</p>
          <p className="text-gray-600 font-mono">{formatPrescriptionFormula(prescription.formula)}</p>
        </div>
      )}

      {/* Image Upload (for RX types) */}
      {!isNonPrescription && prescription.prescription_image_url && (
        <p className="text-green-600 text-xs">✓ Imagen de receta adjunta</p>
      )}

      {/* Warning if no formula or image for RX types */}
      {!isNonPrescription &&
        !prescription.formula &&
        !prescription.prescription_image_url && (
          <p className="text-amber-600 text-xs mt-2">
            ⚠️ Pendiente: Agregar valores o imagen de receta
          </p>
        )}
    </div>
  );
}
