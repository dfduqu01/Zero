/**
 * API Route: Payment Callback Handler
 * GET /api/checkout/payment-callback
 *
 * This route handles the redirect from PagueloFacil after payment attempt.
 * Query params received:
 * - status: 'success' or 'failed'
 * - code: Payment link code (LK-XXX)
 * - tx: Transaction ID (only on success)
 * - PARM_1: Our order number
 * - error: Error message (only on failure)
 *
 * Flow:
 * 1. Parse callback parameters
 * 2. Retrieve checkout session
 * 3. If success: Create order, order items, prescriptions, clear cart
 * 4. If failed: Mark session failed
 * 5. Redirect to appropriate page
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PaymentCallbackParams } from '@/lib/types/payment';
import { sendOrderConfirmationEmail } from '@/lib/email/email-service';
import { buildPrescriptionEmailData, calculateItemPrices } from '@/lib/email/email-helpers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // 1. Parse callback parameters from PagueloFacil's actual format
  // PagueloFacil sends: Estado, Oper, TotalPagado, PARM_1, etc.
  const estado = searchParams.get('Estado'); // 'Aprobada' or 'Denegada'
  const oper = searchParams.get('Oper'); // Transaction ID
  const totalPagado = searchParams.get('TotalPagado'); // Amount paid
  const orderNumber = searchParams.get('PARM_1') || '';
  const razon = searchParams.get('Razon'); // Reason (for denials)

  // Map PagueloFacil's format to our format
  const isApproved = estado === 'Aprobada';
  const callbackParams: PaymentCallbackParams = {
    status: isApproved ? 'success' : 'failed',
    code: searchParams.get('code') || searchParams.get('RelatedTx') || '',
    tx: oper || undefined,
    PARM_1: orderNumber,
    error: isApproved ? undefined : razon || 'Pago rechazado',
  };

  console.log('[payment-callback] Received callback:', {
    estado,
    status: callbackParams.status,
    orderNumber,
    tx: callbackParams.tx,
    totalPagado,
    razon,
  });

  try {
    // 2. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[payment-callback] Authentication failed:', authError);
      // Redirect to login with return URL
      return NextResponse.redirect(
        new URL('/login?error=auth_required', request.url)
      );
    }

    // 3. Validate parameters
    if (!orderNumber) {
      console.error('[payment-callback] Missing order number');
      return NextResponse.redirect(
        new URL('/checkout?error=invalid_callback', request.url)
      );
    }

    // 4. Retrieve checkout session
    const { data: session, error: sessionError } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('order_number', orderNumber)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      console.error('[payment-callback] Session not found:', sessionError);
      return NextResponse.redirect(
        new URL('/checkout?error=session_not_found', request.url)
      );
    }

    // 5. Check if session already completed (prevent duplicate orders)
    if (session.status === 'completed') {
      console.warn('[payment-callback] Session already completed:', orderNumber);
      // Redirect to existing order confirmation
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', orderNumber)
        .single();

      if (existingOrder) {
        return NextResponse.redirect(
          new URL(`/orders/${existingOrder.id}/confirmation`, request.url)
        );
      }
    }

    // 6. Handle payment success
    if (callbackParams.status === 'success' && callbackParams.tx) {
      console.log('[payment-callback] Payment successful, creating order:', orderNumber);

      // Update session with payment link code and mark as completed
      await supabase
        .from('checkout_sessions')
        .update({
          payment_link_code: callbackParams.code,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      // Use shipping cost stored in session (calculated at checkout time)
      // Fallback to 0 if not set (shouldn't happen for new orders)
      const shippingCost = parseFloat(session.shipping_cost) || 0;

      // Fetch prescription lookup tables for correct pricing
      const [lensTypesResult, lensIndexesResult, viewAreasResult] = await Promise.all([
        supabase.from('lens_types').select('id, price_modifier'),
        supabase.from('lens_indexes').select('id, price_modifier'),
        supabase.from('view_areas').select('id, price_modifier'),
      ]);

      const lensTypesMap = new Map((lensTypesResult.data || []).map(lt => [lt.id, lt.price_modifier]));
      const lensIndexesMap = new Map((lensIndexesResult.data || []).map(li => [li.id, li.price_modifier]));
      const viewAreasMap = new Map((viewAreasResult.data || []).map(va => [va.id, va.price_modifier]));

      // Calculate treatments cost (lenses and prescription upgrades)
      // IMPORTANT: Recalculate unit_price from prescription data (fixes old cart items with wrong prices)
      const cartSnapshot = session.cart_snapshot as any[];
      console.log('[payment-callback] Cart snapshot:', JSON.stringify(cartSnapshot, null, 2));

      const treatmentsCost = cartSnapshot.reduce((total: number, item: any) => {
        const basePrice = item.product_snapshot?.price || 0;

        // Recalculate unit_price from prescription data
        let correctUnitPrice = basePrice;
        if (item.prescription) {
          const lensTypeCost = lensTypesMap.get(item.prescription.lens_type_id) || 0;
          const lensIndexCost = lensIndexesMap.get(item.prescription.lens_index_id) || 0;
          const viewAreaCost = viewAreasMap.get(item.prescription.view_area_id) || 0;
          correctUnitPrice = basePrice + lensTypeCost + lensIndexCost + viewAreaCost;
        }

        const prescriptionCost = correctUnitPrice - basePrice;
        console.log('[payment-callback] Item calc:', {
          productName: item.product_snapshot?.name,
          basePrice,
          storedUnitPrice: item.unit_price,
          correctedUnitPrice: correctUnitPrice,
          prescriptionCost,
          quantity: item.quantity,
          itemTotal: prescriptionCost * item.quantity
        });
        return total + (prescriptionCost * item.quantity);
      }, 0);

      console.log('[payment-callback] Total treatments cost:', treatmentsCost);

      // Fetch shipping address BEFORE creating order (for snapshot)
      const { data: shippingAddress, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', session.address_id)
        .single();

      if (addressError || !shippingAddress) {
        console.error('[payment-callback] Shipping address not found:', addressError);
        return NextResponse.redirect(
          new URL('/checkout?error=address_not_found', request.url)
        );
      }

      // Create order with shipping address snapshot
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          shipping_address_id: session.address_id,
          shipping_address_snapshot: {
            full_name: shippingAddress.full_name,
            phone: shippingAddress.phone,
            country: shippingAddress.country,
            address_line_1: shippingAddress.address_line_1,
            address_line_2: shippingAddress.address_line_2,
            city: shippingAddress.city,
            state_province: shippingAddress.state_province,
            postal_code: shippingAddress.postal_code,
          },
          shipping_method: session.shipping_method,
          subtotal: session.amount - shippingCost - treatmentsCost, // Base products only
          treatments_cost: treatmentsCost,
          shipping_cost: shippingCost,
          total: session.amount,
          payment_method: 'PagueloFacil',
          payment_status: 'completed',
          payment_transaction_id: callbackParams.tx,
          status: 'pending', // Order status (not payment status)
        })
        .select()
        .single();

      if (orderError) {
        console.error('[payment-callback] Order creation failed:', orderError);
        return NextResponse.redirect(
          new URL('/checkout?error=order_creation_failed', request.url)
        );
      }

      console.log('[payment-callback] Order created:', order.id);

      // Create order items from cart snapshot
      const orderItems = cartSnapshot.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price,
        product_snapshot: item.product_snapshot, // Include full product details
      }));

      const { data: createdItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select();

      if (itemsError) {
        console.error('[payment-callback] Order items creation failed:', itemsError);
        // Continue anyway - order is created
      }

      // Copy prescriptions from cart items to order_item_prescriptions
      if (createdItems && createdItems.length > 0) {
        const prescriptionInserts = createdItems
          .map((orderItem: any, index: number) => {
            const cartItem = cartSnapshot[index];
            console.log('[payment-callback] Cart item prescription data:', {
              index,
              hasPrescription: !!cartItem?.prescription,
              prescriptionData: cartItem?.prescription,
            });

            if (cartItem?.prescription) {
              const presc = cartItem.prescription;
              // Only include fields that exist in order_item_prescriptions table
              return {
                order_item_id: orderItem.id,
                prescription_type_id: presc.prescription_type_id,
                lens_type_id: presc.lens_type_id,
                lens_index_id: presc.lens_index_id,
                view_area_id: presc.view_area_id,
                od_sph: presc.od_sph,
                od_cyl: presc.od_cyl,
                od_axis: presc.od_axis,
                os_sph: presc.os_sph,
                os_cyl: presc.os_cyl,
                os_axis: presc.os_axis,
                pd: presc.pd,
                pd_dual_od: presc.pd_dual_od,
                pd_dual_os: presc.pd_dual_os,
                add_value: presc.add_value,
                prescription_image_url: presc.prescription_image_url,
                validation_status: 'pending',
              };
            }
            return null;
          })
          .filter(Boolean); // Remove nulls

        console.log('[payment-callback] Prescription inserts:', {
          count: prescriptionInserts.length,
          data: prescriptionInserts,
        });

        if (prescriptionInserts.length > 0) {
          const { error: prescriptionError } = await supabase
            .from('order_item_prescriptions')
            .insert(prescriptionInserts);

          if (prescriptionError) {
            console.error(
              '[payment-callback] Prescription creation failed:',
              prescriptionError
            );
            // Continue anyway
          } else {
            console.log('[payment-callback] Prescriptions saved successfully');
          }
        }
      }

      // Clear user's cart
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      // Send order confirmation email
      try {
        // Fetch user profile for email
        const { data: userProfile } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();

        // shippingAddress already fetched above

        // Fetch prescription lookup tables for email formatting
        const [lensTypesResult, lensIndexesResult, viewAreasResult, prescriptionTypesResult] = await Promise.all([
          supabase.from('lens_types').select('*'),
          supabase.from('lens_indexes').select('*'),
          supabase.from('view_areas').select('*'),
          supabase.from('prescription_types').select('*'),
        ]);

        const lensTypes = lensTypesResult.data || [];
        const lensIndexes = lensIndexesResult.data || [];
        const viewAreas = viewAreasResult.data || [];
        const prescriptionTypes = prescriptionTypesResult.data || [];

        if (userProfile && shippingAddress) {
          // Build items with detailed prescription info
          const emailItems = cartSnapshot.map((item: any) => {
            const basePrice = item.product_snapshot?.price || 0;

            // Recalculate correct unit_price from prescription data (same as above)
            let correctUnitPrice = basePrice;
            if (item.prescription) {
              const lensTypeCost = lensTypesMap.get(item.prescription.lens_type_id) || 0;
              const lensIndexCost = lensIndexesMap.get(item.prescription.lens_index_id) || 0;
              const viewAreaCost = viewAreasMap.get(item.prescription.view_area_id) || 0;
              correctUnitPrice = basePrice + lensTypeCost + lensIndexCost + viewAreaCost;
            }

            const baseData = {
              name: item.product_snapshot?.name || 'Unknown Product',
              sku: item.product_snapshot?.sku || 'N/A',
              quantity: item.quantity,
              basePrice: `$${basePrice.toFixed(2)}`,
              totalPrice: `$${correctUnitPrice.toFixed(2)}`,  // Use corrected price
            };

            // Add prescription details if present
            if (item.prescription) {
              const prescriptionData = buildPrescriptionEmailData(
                item.prescription,
                lensTypes,
                lensIndexes,
                viewAreas,
                prescriptionTypes
              );

              if (prescriptionData) {
                return {
                  ...baseData,
                  prescription: prescriptionData,
                };
              }
            }

            return baseData;
          });

          const emailData = {
            orderNumber: orderNumber,
            customerName: userProfile.name,
            customerEmail: user.email!,
            orderDate: new Date(order.created_at).toLocaleDateString('es-ES'),
            total: `$${order.total.toFixed(2)}`,
            subtotal: `$${order.subtotal.toFixed(2)}`,
            lensesCost: `$${order.treatments_cost.toFixed(2)}`,
            shippingCost: `$${order.shipping_cost.toFixed(2)}`,
            items: emailItems,
            shippingAddress: {
              fullName: shippingAddress.full_name,
              addressLine1: shippingAddress.address_line_1,
              addressLine2: shippingAddress.address_line_2 || undefined,
              city: shippingAddress.city,
              stateProvince: shippingAddress.state_province,
              postalCode: shippingAddress.postal_code,
              country: shippingAddress.country,
            },
          };

          // Send email (non-blocking - don't wait for it)
          sendOrderConfirmationEmail(emailData).catch((err) =>
            console.error('[payment-callback] Failed to send order confirmation email:', err)
          );
        }
      } catch (emailError) {
        console.error('[payment-callback] Email preparation failed:', emailError);
        // Continue anyway - order is created
      }

      console.log('[payment-callback] Order complete, redirecting to confirmation');

      // Redirect to order confirmation page using HTML with JavaScript
      // This works better than 307 redirect from external sites like PagueloFacil
      const confirmationUrl = `/orders/${order.id}/confirmation`;

      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta http-equiv="refresh" content="0;url=${confirmationUrl}">
            <title>Pago Completado</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: #f3f4f6;
              }
              .loading {
                text-align: center;
              }
              .spinner {
                border: 4px solid #e5e7eb;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="loading">
              <div class="spinner"></div>
              <p>Pago completado exitosamente</p>
              <p>Redirigiendo a tu pedido...</p>
            </div>
            <script>
              // Immediate redirect
              window.location.href = "${confirmationUrl}";
            </script>
          </body>
        </html>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        }
      );
    }

    // 7. Handle payment failure
    else {
      console.warn('[payment-callback] Payment failed:', {
        orderNumber,
        error: callbackParams.error,
      });

      // Mark session as failed
      await supabase
        .from('checkout_sessions')
        .update({
          payment_link_code: callbackParams.code,
          status: 'failed',
        })
        .eq('id', session.id);

      // Redirect back to checkout with error using HTML/JavaScript
      const errorMessage = encodeURIComponent(
        callbackParams.error || 'El pago no pudo ser procesado. Intente nuevamente'
      );
      const checkoutUrl = `/checkout?error=${errorMessage}`;

      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta http-equiv="refresh" content="0;url=${checkoutUrl}">
            <title>Error en el Pago</title>
          </head>
          <body>
            <p>Redirigiendo...</p>
            <script>window.location.href = "${checkoutUrl}";</script>
          </body>
        </html>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }
  } catch (error) {
    console.error('[payment-callback] Unexpected error:', error);
    const checkoutUrl = '/checkout?error=unexpected_error';

    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="refresh" content="0;url=${checkoutUrl}">
          <title>Error</title>
        </head>
        <body>
          <p>Redirigiendo...</p>
          <script>window.location.href = "${checkoutUrl}";</script>
        </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}
