'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface OrderStatusFormProps {
  orderId: string;
  currentStatus: string;
  currentTrackingNumber: string | null;
  currentTrackingCarrier: string | null;
}

export default function OrderStatusForm({
  orderId,
  currentStatus,
  currentTrackingNumber,
  currentTrackingCarrier,
}: OrderStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [trackingNumber, setTrackingNumber] = useState(currentTrackingNumber || '');
  const [trackingCarrier, setTrackingCarrier] = useState(currentTrackingCarrier || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const statusOptions = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'processing', label: 'Procesando' },
    { value: 'shipped', label: 'Enviado' },
    { value: 'delivered', label: 'Entregado' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();

      // Update order status and tracking info
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status,
          tracking_number: trackingNumber || null,
          tracking_carrier: trackingCarrier || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Create status history entry
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          from_status: currentStatus,
          to_status: status,
          notes: notes || null,
          tracking_number: trackingNumber || null,
        });

      if (historyError) throw historyError;

      // Send shipping notification email if status changed to 'shipped' and tracking info provided
      if (status === 'shipped' && trackingNumber && trackingCarrier) {
        try {
          const emailResponse = await fetch(`/api/orders/${orderId}/send-shipped-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!emailResponse.ok) {
            console.error('Failed to send shipping notification email');
            // Don't throw error - order was still updated successfully
          } else {
            console.log('Shipping notification email sent successfully');
          }
        } catch (emailError) {
          console.error('Error sending shipping email:', emailError);
          // Don't throw error - order was still updated successfully
        }
      }

      setMessage({ type: 'success', text: 'Estado del pedido actualizado exitosamente' });

      // Reset notes field
      setNotes('');

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error updating order status:', error);
      setMessage({ type: 'error', text: 'Error al actualizar el estado del pedido. Por favor, intente de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Status Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Status Dropdown */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Estado del Pedido
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tracking Number */}
      <div>
        <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Número de Rastreo
        </label>
        <input
          type="text"
          id="trackingNumber"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Ej: 1234567890"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>

      {/* Tracking Carrier */}
      <div>
        <label htmlFor="trackingCarrier" className="block text-sm font-medium text-gray-700 mb-1">
          Empresa de Envío
        </label>
        <input
          type="text"
          id="trackingCarrier"
          value={trackingCarrier}
          onChange={(e) => setTrackingCarrier(e.target.value)}
          placeholder="Ej: FedEx, DHL, UPS"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notas (opcional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Agregar notas sobre el cambio de estado..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || status === currentStatus}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Actualizando...' : 'Actualizar Estado'}
      </button>

      {status === currentStatus && (
        <p className="text-sm text-gray-500 text-center">
          Seleccione un estado diferente para actualizar el pedido
        </p>
      )}
    </form>
  );
}
