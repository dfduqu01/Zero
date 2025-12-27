/**
 * API Route: Create Payment Link
 * POST /api/checkout/create-payment-link
 *
 * Creates a single-use payment link via PagueloFacil LinkDeamon API.
 * User will be redirected to this link to complete payment on PagueloFacil's hosted page.
 *
 * Flow:
 * 1. Authenticate user
 * 2. Validate request data
 * 3. Call PagueloFacil LinkDeamon to create payment link
 * 4. Return payment URL to frontend for redirect
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPagueloFacilClient } from '@/lib/payment/paguelofacil-client';
import {
  type CreatePaymentRequest,
  type CreatePaymentResponse,
  PaymentErrorType,
} from '@/lib/types/payment';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[create-payment-link] Authentication failed:', authError);
      return NextResponse.json(
        {
          success: false,
          error: 'Debe iniciar sesión para continuar',
        } as CreatePaymentResponse,
        { status: 401 }
      );
    }

    // 2. Parse and validate request
    const body = (await request.json()) as CreatePaymentRequest;
    const { amount, orderNumber, description } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El monto debe ser mayor a cero',
        } as CreatePaymentResponse,
        { status: 400 }
      );
    }

    if (!orderNumber || orderNumber.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Número de orden requerido',
        } as CreatePaymentResponse,
        { status: 400 }
      );
    }

    if (!description || description.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Descripción requerida',
        } as CreatePaymentResponse,
        { status: 400 }
      );
    }

    console.log('[create-payment-link] Creating payment link for order:', {
      orderNumber,
      amount,
      userId: user.id,
    });

    // 3. Fetch checkout session to get product details
    const { data: session } = await supabase
      .from('checkout_sessions')
      .select('cart_snapshot')
      .eq('order_number', orderNumber)
      .eq('user_id', user.id)
      .single();

    // Build enhanced description with product details
    let enhancedDescription = `ZERO Optical - Order #${orderNumber}`;

    if (session?.cart_snapshot) {
      const cartItems = session.cart_snapshot as any[];
      if (cartItems.length > 0) {
        // Add first product details (within 150 char limit)
        const firstItem = cartItems[0];
        const productInfo = firstItem.product_snapshot;
        if (productInfo) {
          const hasPrescription = !!firstItem.prescription;
          const prescriptionTag = hasPrescription ? ' + Rx' : '';
          enhancedDescription = `${productInfo.name || 'Product'} (${productInfo.sku || ''})${prescriptionTag}`;

          // Add count if multiple items
          if (cartItems.length > 1) {
            enhancedDescription += ` +${cartItems.length - 1} more`;
          }

          // Ensure within 150 char limit
          if (enhancedDescription.length > 140) {
            enhancedDescription = enhancedDescription.substring(0, 137) + '...';
          }
        }
      }
    }

    console.log('[create-payment-link] Enhanced description:', enhancedDescription);

    // 4. Get app URL for callback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error('[create-payment-link] NEXT_PUBLIC_APP_URL not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Configuración de pago incompleta. Contacte soporte',
        } as CreatePaymentResponse,
        { status: 500 }
      );
    }

    // Build callback URL (PagueloFacil will redirect here after payment)
    const returnUrl = `${appUrl}/api/checkout/payment-callback`;

    // 4. Create PagueloFacil client and payment link
    const client = createPagueloFacilClient();

    // Match the-leap working implementation - minimal parameters only
    const linkResponse = await client.createPaymentLink({
      amount,
      description: enhancedDescription, // Use enhanced description with product details
      returnUrl,
      orderNumber,
      expiresIn: 3600, // 1 hour
    });

    // 5. Check if link creation was successful
    if (linkResponse.success && linkResponse.data?.url && linkResponse.data?.code) {
      console.log('[create-payment-link] Payment link created successfully:', {
        code: linkResponse.data.code,
        orderNumber,
      });

      return NextResponse.json(
        {
          success: true,
          paymentUrl: linkResponse.data.url,
          paymentCode: linkResponse.data.code,
        } as CreatePaymentResponse,
        { status: 200 }
      );
    } else {
      // Link creation failed
      console.error('[create-payment-link] Link creation failed:', {
        message: linkResponse.message,
        status: linkResponse.headerStatus,
      });

      return NextResponse.json(
        {
          success: false,
          error: linkResponse.message || 'No se pudo crear el enlace de pago',
        } as CreatePaymentResponse,
        { status: 400 }
      );
    }
  } catch (error: any) {
    // Handle payment errors from client
    if (error.type && error.retryable !== undefined) {
      console.error('[create-payment-link] Payment error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Error al crear el enlace de pago',
        } as CreatePaymentResponse,
        { status: error.type === PaymentErrorType.NETWORK_ERROR ? 503 : 400 }
      );
    }

    // Handle unexpected errors
    console.error('[create-payment-link] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar la solicitud. Intente nuevamente',
      } as CreatePaymentResponse,
      { status: 500 }
    );
  }
}
