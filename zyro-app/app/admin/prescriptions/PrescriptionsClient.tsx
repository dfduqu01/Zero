'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type {
  PrescriptionType,
  LensType,
  LensIndex,
  ViewArea,
} from '@/lib/types/prescription';
import { formatPrescriptionFormula } from '@/lib/utils/prescription-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Eye, FileText } from 'lucide-react';

interface OrderItemPrescription {
  id: string;
  order_item_id: string;
  prescription_type_id: string | null;
  lens_type_id: string | null;
  lens_index_id: string | null;
  view_area_id: string | null;
  od_sph: number | null;
  od_cyl: number | null;
  od_axis: number | null;
  os_sph: number | null;
  os_cyl: number | null;
  os_axis: number | null;
  pd: number | null;
  pd_dual_od: number | null;
  pd_dual_os: number | null;
  add_value: number | null;
  prescription_image_url: string | null;
  validation_status: 'pending' | 'approved' | 'rejected';
  validated_by_user_id: string | null;
  validated_at: string | null;
  validation_notes: string | null;
  created_at: string;
  order_item: {
    id: string;
    product_name: string;
    product_sku: string;
    quantity: number;
    unit_price: number;
    order: {
      id: string;
      order_number: string;
      created_at: string;
      status: string;
      user: {
        full_name: string;
        email: string;
        phone: string;
        country: string;
      };
    };
  };
}

interface PrescriptionsClientProps {
  initialPrescriptions: OrderItemPrescription[];
  prescriptionTypes: PrescriptionType[];
  lensTypes: LensType[];
  lensIndexes: LensIndex[];
  viewAreas: ViewArea[];
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function PrescriptionsClient({
  initialPrescriptions,
  prescriptionTypes,
  lensTypes,
  lensIndexes,
  viewAreas,
}: PrescriptionsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [prescriptions, setPrescriptions] = useState<OrderItemPrescription[]>(initialPrescriptions);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [selectedPrescription, setSelectedPrescription] = useState<OrderItemPrescription | null>(
    null
  );
  const [validationNotes, setValidationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter prescriptions by status
  const filteredPrescriptions =
    filter === 'all'
      ? prescriptions
      : prescriptions.filter((p) => p.validation_status === filter);

  // Count prescriptions by status
  const counts = {
    all: prescriptions.length,
    pending: prescriptions.filter((p) => p.validation_status === 'pending').length,
    approved: prescriptions.filter((p) => p.validation_status === 'approved').length,
    rejected: prescriptions.filter((p) => p.validation_status === 'rejected').length,
  };

  // Get prescription details
  const getPrescriptionDetails = (prescription: OrderItemPrescription) => {
    const prescriptionType = prescriptionTypes.find(
      (pt) => pt.id === prescription.prescription_type_id
    );
    const lensType = lensTypes.find((lt) => lt.id === prescription.lens_type_id);
    const lensIndex = lensIndexes.find((li) => li.id === prescription.lens_index_id);
    const viewArea = viewAreas.find((va) => va.id === prescription.view_area_id);

    return { prescriptionType, lensType, lensIndex, viewArea };
  };

  // Handle validation
  const handleValidation = async (
    prescriptionId: string,
    status: 'approved' | 'rejected'
  ) => {
    setIsSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        alert('No estas autenticado');
        return;
      }

      const { error } = await supabase
        .from('order_item_prescriptions')
        .update({
          validation_status: status,
          validated_by_user_id: userData.user.id,
          validated_at: new Date().toISOString(),
          validation_notes: validationNotes || null,
        })
        .eq('id', prescriptionId);

      if (error) {
        console.error('Error updating prescription:', error);
        alert('Error al actualizar la prescripcion');
        return;
      }

      // Update local state to reflect the change immediately
      setPrescriptions((prev) =>
        prev.map((p) =>
          p.id === prescriptionId
            ? {
                ...p,
                validation_status: status,
                validated_by_user_id: userData.user.id,
                validated_at: new Date().toISOString(),
                validation_notes: validationNotes || null,
              }
            : p
        )
      );

      alert(
        `Prescripcion ${status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`
      );
      setSelectedPrescription(null);
      setValidationNotes('');
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la validacion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Validacion de Prescripciones
        </h1>
        <p className="text-gray-600">
          Revisa y valida las prescripciones de los clientes antes de procesar pedidos.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Todas ({counts.all})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Pendientes ({counts.pending})
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          onClick={() => setFilter('approved')}
          className="flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Aprobadas ({counts.approved})
        </Button>
        <Button
          variant={filter === 'rejected' ? 'default' : 'outline'}
          onClick={() => setFilter('rejected')}
          className="flex items-center gap-2"
        >
          <XCircle className="h-4 w-4" />
          Rechazadas ({counts.rejected})
        </Button>
      </div>

      {/* Prescriptions List */}
      {filteredPrescriptions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 text-lg">
              {filter === 'all'
                ? 'No hay prescripciones registradas'
                : `No hay prescripciones ${
                    filter === 'pending'
                      ? 'pendientes'
                      : filter === 'approved'
                        ? 'aprobadas'
                        : 'rechazadas'
                  }`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPrescriptions.map((prescription) => {
            const { prescriptionType, lensType, lensIndex, viewArea } =
              getPrescriptionDetails(prescription);
            const order = prescription.order_item.order;

            return (
              <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">
                        {prescription.order_item.product_name}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          Pedido: {order.order_number}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          SKU: {prescription.order_item.product_sku}
                        </Badge>
                        {prescription.validation_status === 'pending' && (
                          <Badge className="bg-yellow-500 hover:bg-yellow-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                        {prescription.validation_status === 'approved' && (
                          <Badge className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Aprobada
                          </Badge>
                        )}
                        {prescription.validation_status === 'rejected' && (
                          <Badge className="bg-red-600 hover:bg-red-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rechazada
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPrescription(prescription)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer Info */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Cliente</p>
                    <p className="text-sm font-semibold text-gray-900">{order.user.full_name}</p>
                    <p className="text-sm text-gray-600">{order.user.email}</p>
                    <p className="text-sm text-gray-600">📱 {order.user.phone}</p>
                    <p className="text-sm text-gray-500">{order.user.country}</p>
                  </div>

                  {/* Prescription Configuration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tipo de Prescripcion</p>
                      <p className="text-sm font-medium text-gray-900">
                        {prescriptionType?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tipo de Lente</p>
                      <p className="text-sm font-medium text-gray-900">
                        {lensType?.name || 'N/A'}
                      </p>
                    </div>
                    {lensIndex && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Indice</p>
                        <p className="text-sm font-medium text-gray-900">{lensIndex.name}</p>
                      </div>
                    )}
                    {viewArea && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Area de Vision</p>
                        <p className="text-sm font-medium text-gray-900">{viewArea.name}</p>
                      </div>
                    )}
                  </div>

                  {/* Formula */}
                  {(prescription.od_sph !== null || prescription.os_sph !== null) && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-xs font-medium text-blue-900 mb-2">
                        Formula Ingresada
                      </p>
                      <p className="text-sm text-blue-800 font-mono">
                        {formatPrescriptionFormula({
                          od_sph: prescription.od_sph ?? undefined,
                          od_cyl: prescription.od_cyl ?? undefined,
                          od_axis: prescription.od_axis ?? undefined,
                          os_sph: prescription.os_sph ?? undefined,
                          os_cyl: prescription.os_cyl ?? undefined,
                          os_axis: prescription.os_axis ?? undefined,
                          pd: prescription.pd ?? undefined,
                          add_value: prescription.add_value ?? undefined,
                        })}
                      </p>
                    </div>
                  )}

                  {/* Image */}
                  {prescription.prescription_image_url && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Imagen de Prescripcion
                      </p>
                      <p className="text-xs text-gray-600">
                        Imagen adjunta (ver en detalles)
                      </p>
                    </div>
                  )}

                  {/* Validation Notes (if any) */}
                  {prescription.validation_notes && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-1">Notas</p>
                      <p className="text-sm text-gray-600">{prescription.validation_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Prescription Detail Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Detalle de Prescripcion
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Pedido: {selectedPrescription.order_item.order.order_number}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPrescription(null)}
                >
                  X
                </Button>
              </div>

              {/* Product Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Producto</h3>
                <p className="text-sm font-medium">{selectedPrescription.order_item.product_name}</p>
                <p className="text-sm text-gray-600">SKU: {selectedPrescription.order_item.product_sku}</p>
              </div>

              {/* Customer Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Informacion del Cliente</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Nombre</p>
                    <p className="text-sm font-medium text-blue-900">
                      {selectedPrescription.order_item.order.user.full_name}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-blue-700 mb-1">Email</p>
                      <p className="text-sm text-blue-900">
                        {selectedPrescription.order_item.order.user.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 mb-1">Telefono</p>
                      <p className="text-sm text-blue-900">
                        {selectedPrescription.order_item.order.user.phone}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Pais</p>
                    <p className="text-sm text-blue-900">
                      {selectedPrescription.order_item.order.user.country}
                    </p>
                  </div>
                </div>
              </div>

              {/* Prescription Configuration */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Configuracion</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const details = getPrescriptionDetails(selectedPrescription);
                    return (
                      <>
                        <div>
                          <p className="text-xs text-blue-700 mb-1">Tipo de Prescripcion</p>
                          <p className="text-sm font-medium text-blue-900">
                            {details.prescriptionType?.name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-700 mb-1">Tipo de Lente</p>
                          <p className="text-sm font-medium text-blue-900">
                            {details.lensType?.name || 'N/A'}
                          </p>
                        </div>
                        {details.lensIndex && (
                          <div>
                            <p className="text-xs text-blue-700 mb-1">Indice</p>
                            <p className="text-sm font-medium text-blue-900">
                              {details.lensIndex.name}
                            </p>
                          </div>
                        )}
                        {details.viewArea && (
                          <div>
                            <p className="text-xs text-blue-700 mb-1">Area de Vision</p>
                            <p className="text-sm font-medium text-blue-900">
                              {details.viewArea.name}
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Formula */}
              {(selectedPrescription.od_sph !== null ||
                selectedPrescription.os_sph !== null) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Formula</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-xs font-semibold text-gray-500">Ojo</div>
                      <div className="text-xs font-semibold text-gray-500">SPH</div>
                      <div className="text-xs font-semibold text-gray-500">CYL</div>
                      <div className="text-xs font-semibold text-gray-500">AXIS</div>
                    </div>
                    {selectedPrescription.od_sph !== null && (
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-sm font-medium">OD</div>
                        <div className="text-sm">{selectedPrescription.od_sph}</div>
                        <div className="text-sm">{selectedPrescription.od_cyl ?? '--'}</div>
                        <div className="text-sm">{selectedPrescription.od_axis ?? '--'}</div>
                      </div>
                    )}
                    {selectedPrescription.os_sph !== null && (
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-sm font-medium">OS</div>
                        <div className="text-sm">{selectedPrescription.os_sph}</div>
                        <div className="text-sm">{selectedPrescription.os_cyl ?? '--'}</div>
                        <div className="text-sm">{selectedPrescription.os_axis ?? '--'}</div>
                      </div>
                    )}
                    {selectedPrescription.pd && (
                      <div className="flex gap-2 mt-2">
                        <span className="text-sm font-medium">PD:</span>
                        <span className="text-sm">{selectedPrescription.pd} mm</span>
                      </div>
                    )}
                    {selectedPrescription.add_value && (
                      <div className="flex gap-2">
                        <span className="text-sm font-medium">ADD:</span>
                        <span className="text-sm">+{selectedPrescription.add_value}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Prescription Image */}
              {selectedPrescription.prescription_image_url && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Imagen de Prescripcion
                  </h3>
                  <div className="relative w-full max-w-xl mx-auto">
                    <img
                      src={selectedPrescription.prescription_image_url}
                      alt="Prescripcion"
                      className="w-full h-auto border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Validation Section */}
              {selectedPrescription.validation_status === 'pending' && (
                <div className="bg-white border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Validacion</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notas (opcional)
                      </label>
                      <textarea
                        value={validationNotes}
                        onChange={(e) => setValidationNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Agrega notas sobre esta prescripcion..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleValidation(selectedPrescription.id, 'approved')}
                        disabled={isSubmitting}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aprobar
                      </Button>
                      <Button
                        onClick={() => handleValidation(selectedPrescription.id, 'rejected')}
                        disabled={isSubmitting}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Info (if already validated) */}
              {selectedPrescription.validation_status !== 'pending' && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Informacion de Validacion
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Estado: </span>
                      {selectedPrescription.validation_status === 'approved' ? (
                        <Badge className="bg-green-600">Aprobada</Badge>
                      ) : (
                        <Badge className="bg-red-600">Rechazada</Badge>
                      )}
                    </div>
                    {selectedPrescription.validated_at && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Fecha: </span>
                        <span className="text-sm text-gray-600">
                          {new Date(selectedPrescription.validated_at).toLocaleString('es-ES', {
                            dateStyle: 'long',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    )}
                    {selectedPrescription.validation_notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Notas:</p>
                        <p className="text-sm text-gray-600">
                          {selectedPrescription.validation_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
