/**
 * Prescription Helper Functions - NEW TABLE STRUCTURE
 * Date: 2025-11-07
 */

import type {
  PrescriptionData,
  PrescriptionFormula,
  PrescriptionPricing,
  PrescriptionValidationResult,
  PrescriptionValidationError,
  PrescriptionType,
  LensType,
  LensIndex,
  ViewArea,
  GroupedLensTypes,
} from '@/lib/types/prescription';

// ============================================================================
// PRICE CALCULATION
// ============================================================================

/**
 * Calculate total price for prescription with new table structure
 */
export function calculatePrescriptionPrice(
  basePrice: number,
  prescription: PrescriptionData | undefined,
  lensTypes: LensType[],
  lensIndexes: LensIndex[],
  viewAreas: ViewArea[],
  additionalTreatments: Array<{ price: number }> = []
): PrescriptionPricing {
  let lens_type_cost = 0;
  let lens_index_cost = 0;
  let view_area_cost = 0;

  if (prescription) {
    // Lens type cost
    if (prescription.lens_type_id) {
      const lensType = lensTypes.find((lt) => lt.id === prescription.lens_type_id);
      lens_type_cost = lensType?.price_modifier || 0;
    }

    // Lens index cost (for prescription types)
    if (prescription.lens_index_id) {
      const lensIndex = lensIndexes.find((li) => li.id === prescription.lens_index_id);
      lens_index_cost = lensIndex?.price_modifier || 0;
    }

    // View area cost (for progressive)
    if (prescription.view_area_id) {
      const viewArea = viewAreas.find((va) => va.id === prescription.view_area_id);
      view_area_cost = viewArea?.price_modifier || 0;
    }
  }

  const treatments_cost = additionalTreatments.reduce((sum, t) => sum + t.price, 0);
  const subtotal = basePrice + lens_type_cost + lens_index_cost + view_area_cost;
  const total = subtotal + treatments_cost;

  return {
    base_price: basePrice,
    lens_type_cost,
    lens_index_cost,
    view_area_cost,
    treatments_cost,
    subtotal,
    total,
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate prescription data based on prescription type
 */
export function validatePrescription(
  prescription: PrescriptionData,
  prescriptionTypes: PrescriptionType[]
): PrescriptionValidationResult {
  const errors: PrescriptionValidationError[] = [];

  // Prescription type is required
  if (!prescription.prescription_type_id) {
    errors.push({
      field: 'prescription_type_id',
      message: 'El tipo de prescripción es requerido',
    });
    return { isValid: false, errors };
  }

  // Get the prescription type to determine validation rules
  const prescriptionType = prescriptionTypes.find(
    (pt) => pt.id === prescription.prescription_type_id
  );

  if (!prescriptionType) {
    errors.push({
      field: 'prescription_type_id',
      message: 'Tipo de prescripción inválido',
    });
    return { isValid: false, errors };
  }

  const isNonPrescription = prescriptionType.slug === 'non-prescription';
  const isSingleVision = prescriptionType.slug === 'single-vision';
  const isProgressive = prescriptionType.slug === 'progressive';

  // Non-Prescription validation (Frame Only flow)
  if (isNonPrescription) {
    if (!prescription.lens_type_id) {
      errors.push({
        field: 'lens_type_id',
        message: 'Selecciona un tipo de lente',
      });
    }
    // No formula or index required for non-prescription
  }

  // Single Vision validation
  if (isSingleVision) {
    if (!prescription.lens_type_id) {
      errors.push({
        field: 'lens_type_id',
        message: 'Selecciona un tipo de lente',
      });
    }
    if (!prescription.lens_index_id) {
      errors.push({
        field: 'lens_index_id',
        message: 'Selecciona el índice de lente',
      });
    }

    // Require formula OR image
    const hasFormula =
      prescription.formula &&
      (prescription.formula.od_sph !== undefined || prescription.formula.os_sph !== undefined);
    const hasImage =
      !!prescription.prescription_image_url || !!prescription.prescription_image_file;

    if (!hasFormula && !hasImage) {
      errors.push({
        field: 'formula',
        message: 'Ingresa los valores de la receta o sube una imagen',
      });
    }
  }

  // Progressive validation
  if (isProgressive) {
    if (!prescription.lens_type_id) {
      errors.push({
        field: 'lens_type_id',
        message: 'Selecciona un tipo de lente',
      });
    }
    if (!prescription.lens_index_id) {
      errors.push({
        field: 'lens_index_id',
        message: 'Selecciona el índice de lente',
      });
    }
    if (!prescription.view_area_id) {
      errors.push({
        field: 'view_area_id',
        message: 'Selecciona el área de visión progresiva',
      });
    }

    // Require formula OR image
    const hasFormula =
      prescription.formula &&
      (prescription.formula.od_sph !== undefined || prescription.formula.os_sph !== undefined);
    const hasImage =
      !!prescription.prescription_image_url || !!prescription.prescription_image_file;

    if (!hasFormula && !hasImage) {
      errors.push({
        field: 'formula',
        message: 'Ingresa los valores de la receta o sube una imagen',
      });
    }
  }

  // Validate formula ranges if provided
  if (prescription.formula) {
    const { formula } = prescription;

    if (formula.od_sph !== undefined && (formula.od_sph < -20 || formula.od_sph > 20)) {
      errors.push({
        field: 'od_sph',
        message: 'SPH debe estar entre -20.00 y +20.00',
      });
    }

    if (formula.od_cyl !== undefined && (formula.od_cyl < -4 || formula.od_cyl > 4)) {
      errors.push({
        field: 'od_cyl',
        message: 'CYL debe estar entre -4.00 y +4.00',
      });
    }

    if (formula.od_axis !== undefined && (formula.od_axis < 0 || formula.od_axis > 180)) {
      errors.push({
        field: 'od_axis',
        message: 'AXIS debe estar entre 0 y 180',
      });
    }

    if (formula.os_sph !== undefined && (formula.os_sph < -20 || formula.os_sph > 20)) {
      errors.push({
        field: 'os_sph',
        message: 'SPH debe estar entre -20.00 y +20.00',
      });
    }

    if (formula.os_cyl !== undefined && (formula.os_cyl < -4 || formula.os_cyl > 4)) {
      errors.push({
        field: 'os_cyl',
        message: 'CYL debe estar entre -4.00 y +4.00',
      });
    }

    if (formula.os_axis !== undefined && (formula.os_axis < 0 || formula.os_axis > 180)) {
      errors.push({
        field: 'os_axis',
        message: 'AXIS debe estar entre 0 y 180',
      });
    }

    if (formula.pd !== undefined && (formula.pd < 20 || formula.pd > 80)) {
      errors.push({
        field: 'pd',
        message: 'PD debe estar entre 20 y 80 mm',
      });
    }

    // ADD value validation (for progressive lenses)
    if (formula.add_value !== undefined && (formula.add_value < 0.5 || formula.add_value > 4)) {
      errors.push({
        field: 'add_value',
        message: 'ADD debe estar entre +0.50 y +4.00',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// IMAGE COMPRESSION
// ============================================================================

/**
 * Compress prescription image before upload
 * Returns base64 string for localStorage or File for server upload
 */
export async function compressPrescriptionImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<{ base64: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Check size (max 500KB)
            if (blob.size > 500 * 1024) {
              reject(new Error('Image still too large after compression. Try a different image.'));
              return;
            }

            // Get base64
            const base64 = canvas.toDataURL('image/jpeg', quality);

            resolve({ base64, blob });
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format prescription formula for display
 */
export function formatPrescriptionFormula(formula: PrescriptionFormula): string {
  const parts: string[] = [];

  if (formula.od_sph !== undefined || formula.od_cyl !== undefined) {
    parts.push(
      `OD: ${formula.od_sph !== undefined ? formatNumber(formula.od_sph) : '--'}` +
        ` ${formula.od_cyl !== undefined ? formatNumber(formula.od_cyl) : '--'}` +
        ` ${formula.od_axis !== undefined ? formula.od_axis + '°' : '--'}`
    );
  }

  if (formula.os_sph !== undefined || formula.os_cyl !== undefined) {
    parts.push(
      `OS: ${formula.os_sph !== undefined ? formatNumber(formula.os_sph) : '--'}` +
        ` ${formula.os_cyl !== undefined ? formatNumber(formula.os_cyl) : '--'}` +
        ` ${formula.os_axis !== undefined ? formula.os_axis + '°' : '--'}`
    );
  }

  if (formula.pd !== undefined) {
    parts.push(`PD: ${formula.pd}mm`);
  }

  if (formula.add_value !== undefined) {
    parts.push(`ADD: ${formatNumber(formula.add_value)}`);
  }

  return parts.join(' | ');
}

/**
 * Format number with sign (+/-)
 * Safely handles null/undefined values
 */
function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '--';
  if (num > 0) return `+${num.toFixed(2)}`;
  return num.toFixed(2);
}

// ============================================================================
// DATA GROUPING HELPERS
// ============================================================================

/**
 * Group lens types by usage (frame only vs prescription)
 * @param lensTypes - All lens types
 * @param prescriptionTypeSlug - Optional prescription type slug to filter by
 */
export function groupLensTypes(lensTypes: LensType[], prescriptionTypeSlug?: string): GroupedLensTypes {
  return {
    frame_only: lensTypes
      .filter((lt) => lt.applies_to_without_rx && lt.is_active)
      .sort((a, b) => a.display_order - b.display_order),
    prescription: lensTypes
      .filter((lt) => {
        if (!lt.is_active) return false;

        // Filter by prescription type if provided
        if (prescriptionTypeSlug === 'single-vision') {
          return lt.applies_to_single_vision;
        } else if (prescriptionTypeSlug === 'progressive') {
          return lt.applies_to_progressive;
        }

        // Fallback: show all prescription lens types
        return lt.applies_to_with_rx || lt.applies_to_single_vision || lt.applies_to_progressive;
      })
      .sort((a, b) => a.display_order - b.display_order),
  };
}

/**
 * Get active lens indexes sorted by display order
 * @param lensIndexes - All lens indexes
 * @param prescriptionTypeSlug - Optional prescription type slug to filter by
 */
export function getActiveLensIndexes(lensIndexes: LensIndex[], prescriptionTypeSlug?: string): LensIndex[] {
  return lensIndexes
    .filter((li) => {
      if (!li.is_active) return false;

      // Filter by prescription type if provided
      if (prescriptionTypeSlug === 'single-vision') {
        return li.applies_to_single_vision;
      } else if (prescriptionTypeSlug === 'progressive') {
        return li.applies_to_progressive;
      }

      // Fallback: show all active lens indexes
      return true;
    })
    .sort((a, b) => a.display_order - b.display_order);
}

/**
 * Get active view areas sorted by display order
 */
export function getActiveViewAreas(viewAreas: ViewArea[]): ViewArea[] {
  return viewAreas
    .filter((va) => va.is_active)
    .sort((a, b) => a.display_order - b.display_order);
}

/**
 * Get active prescription types sorted by display order
 */
export function getActivePrescriptionTypes(prescriptionTypes: PrescriptionType[]): PrescriptionType[] {
  return prescriptionTypes
    .filter((pt) => pt.is_active)
    .sort((a, b) => a.display_order - b.display_order);
}
