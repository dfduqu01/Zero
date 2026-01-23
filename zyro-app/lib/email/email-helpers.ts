/**
 * Email Helper Functions
 * Utilities for formatting prescription and order data for email templates
 */

export interface PrescriptionEmailData {
  type: string; // e.g., "Visión Sencilla - Distancia"
  lensType: string; // e.g., "Bloqueo de Luz Azul"
  lensTypePrice: string; // e.g., "$25.00"
  lensIndex?: string; // e.g., "High-Index (1.60)"
  lensIndexPrice?: string; // e.g., "$50.00"
  viewArea?: string; // e.g., "40% Broader View"
  viewAreaPrice?: string; // e.g., "$75.00"
  hasFormula: boolean;
  formula?: string; // Formatted formula string
  hasImage: boolean;
}

export interface EmailItemData {
  name: string;
  sku: string;
  quantity: number;
  basePrice: string; // Frame price only
  totalPrice: string; // With all addons
  prescription?: PrescriptionEmailData;
}

/**
 * Build prescription data formatted for email templates
 */
export function buildPrescriptionEmailData(
  prescription: any,
  lensTypes: any[],
  lensIndexes: any[],
  viewAreas: any[],
  prescriptionTypes: any[]
): PrescriptionEmailData | null {
  if (!prescription) return null;

  // Find related records
  const prescType = prescriptionTypes.find(
    (pt) => pt.id === prescription.prescription_type_id
  );
  const lensType = lensTypes.find((lt) => lt.id === prescription.lens_type_id);
  const lensIndex = lensIndexes.find(
    (li) => li.id === prescription.lens_index_id
  );
  const viewArea = viewAreas.find((va) => va.id === prescription.view_area_id);

  if (!prescType || !lensType) {
    console.warn('[email-helpers] Missing prescription type or lens type');
    return null;
  }

  const result: PrescriptionEmailData = {
    type: prescType.name || 'Prescription',
    lensType: lensType.name || 'Standard',
    lensTypePrice: `$${(lensType.price_modifier || 0).toFixed(2)}`,
    hasFormula: false,
    hasImage: !!prescription.prescription_image_url,
  };

  // Add lens index if present (for RX types)
  if (lensIndex) {
    result.lensIndex = lensIndex.name;
    result.lensIndexPrice = `$${(lensIndex.price_modifier || 0).toFixed(2)}`;
  }

  // Add view area if present (for Progressive)
  if (viewArea) {
    result.viewArea = viewArea.name;
    result.viewAreaPrice = `$${(viewArea.price_modifier || 0).toFixed(2)}`;
  }

  // Format prescription formula if present
  if (
    prescription.od_sph !== null ||
    prescription.os_sph !== null ||
    prescription.pd !== null
  ) {
    result.hasFormula = true;
    result.formula = formatPrescriptionForEmail(prescription);
  }

  return result;
}

/**
 * Format prescription values for email display
 */
function formatPrescriptionForEmail(prescription: any): string {
  const parts: string[] = [];

  // Right Eye (OD)
  if (prescription.od_sph !== null) {
    const sph = formatNumber(prescription.od_sph);
    const cyl = prescription.od_cyl !== null ? formatNumber(prescription.od_cyl) : '';
    const axis = prescription.od_axis !== null ? `×${prescription.od_axis}°` : '';
    parts.push(`OD: ${sph} ${cyl} ${axis}`.trim());
  }

  // Left Eye (OS)
  if (prescription.os_sph !== null) {
    const sph = formatNumber(prescription.os_sph);
    const cyl = prescription.os_cyl !== null ? formatNumber(prescription.os_cyl) : '';
    const axis = prescription.os_axis !== null ? `×${prescription.os_axis}°` : '';
    parts.push(`OS: ${sph} ${cyl} ${axis}`.trim());
  }

  // PD
  if (prescription.pd !== null) {
    parts.push(`PD: ${prescription.pd}mm`);
  } else if (prescription.pd_dual_od && prescription.pd_dual_os) {
    parts.push(`PD: ${prescription.pd_dual_od}/${prescription.pd_dual_os}mm`);
  }

  // ADD (for progressive)
  if (prescription.add_value !== null) {
    parts.push(`ADD: ${formatNumber(prescription.add_value)}`);
  }

  return parts.join(', ');
}

/**
 * Format a number with sign for prescription values
 */
function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
}

/**
 * Calculate item price breakdown
 */
export function calculateItemPrices(
  basePrice: number,
  prescription: any,
  lensTypes: any[],
  lensIndexes: any[],
  viewAreas: any[]
): { basePrice: string; totalPrice: string } {
  let total = basePrice;

  if (prescription) {
    // Add lens type cost
    const lensType = lensTypes.find((lt) => lt.id === prescription.lens_type_id);
    if (lensType && lensType.price_modifier) {
      total += parseFloat(lensType.price_modifier);
    }

    // Add lens index cost
    const lensIndex = lensIndexes.find((li) => li.id === prescription.lens_index_id);
    if (lensIndex && lensIndex.price_modifier) {
      total += parseFloat(lensIndex.price_modifier);
    }

    // Add view area cost
    const viewArea = viewAreas.find((va) => va.id === prescription.view_area_id);
    if (viewArea && viewArea.price_modifier) {
      total += parseFloat(viewArea.price_modifier);
    }
  }

  return {
    basePrice: `$${basePrice.toFixed(2)}`,
    totalPrice: `$${total.toFixed(2)}`,
  };
}
