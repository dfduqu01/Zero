/**
 * API Route: Checkout Session Management
 * POST /api/checkout/session - Save checkout session before redirect
 * GET /api/checkout/session?orderNumber=XXX - Retrieve session after callback
 *
 * This route manages checkout sessions that store the user's cart and shipping info
 * before redirecting to PagueloFacil. After payment, we retrieve the session to create the order.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  type SaveSessionRequest,
  type SessionResponse,
  type CheckoutSession,
} from '@/lib/types/payment';

/**
 * POST - Save checkout session before redirecting to payment
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[session] Authentication failed:', authError);
      return NextResponse.json(
        {
          success: false,
          error: 'Debe iniciar sesión para continuar',
        } as SessionResponse,
        { status: 401 }
      );
    }

    // 2. Parse and validate request
    const body = (await request.json()) as SaveSessionRequest;
    const { orderNumber, addressId, shippingMethod, cartItems, amount } = body;

    // Validate required fields
    if (!orderNumber || !addressId || !shippingMethod || !cartItems || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de sesión incompletos',
        } as SessionResponse,
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El monto debe ser mayor a cero',
        } as SessionResponse,
        { status: 400 }
      );
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El carrito está vacío',
        } as SessionResponse,
        { status: 400 }
      );
    }

    console.log('[session] Saving checkout session:', {
      orderNumber,
      userId: user.id,
      itemCount: cartItems.length,
      amount,
    });

    // 3. Save session to database
    const { data: session, error: dbError } = await supabase
      .from('checkout_sessions')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        address_id: addressId,
        shipping_method: shippingMethod,
        cart_snapshot: cartItems,
        amount,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('[session] Database error:', dbError);

      // Check for duplicate order number
      if (dbError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: 'Este número de orden ya existe. Intente nuevamente',
          } as SessionResponse,
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Error al guardar la sesión. Intente nuevamente',
        } as SessionResponse,
        { status: 500 }
      );
    }

    console.log('[session] Session saved successfully:', session.id);

    return NextResponse.json(
      {
        success: true,
        session: {
          id: session.id,
          userId: session.user_id,
          orderNumber: session.order_number,
          addressId: session.address_id,
          shippingMethod: session.shipping_method,
          cartSnapshot: session.cart_snapshot,
          amount: parseFloat(session.amount),
          status: session.status,
          createdAt: session.created_at,
          expiresAt: session.expires_at,
        } as CheckoutSession,
      } as SessionResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('[session] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar la solicitud',
      } as SessionResponse,
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve checkout session by order number
 * Query param: orderNumber
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[session] Authentication failed:', authError);
      return NextResponse.json(
        {
          success: false,
          error: 'Debe iniciar sesión para continuar',
        } as SessionResponse,
        { status: 401 }
      );
    }

    // 2. Get order number from query params
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');

    if (!orderNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Número de orden requerido',
        } as SessionResponse,
        { status: 400 }
      );
    }

    console.log('[session] Retrieving session for order:', orderNumber);

    // 3. Retrieve session from database
    const { data: session, error: dbError } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('order_number', orderNumber)
      .eq('user_id', user.id) // Ensure user owns this session
      .single();

    if (dbError || !session) {
      console.error('[session] Session not found:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Sesión no encontrada o expirada',
        } as SessionResponse,
        { status: 404 }
      );
    }

    // 4. Check if session has expired
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      console.warn('[session] Session expired:', orderNumber);

      // Mark as expired
      await supabase
        .from('checkout_sessions')
        .update({ status: 'expired' })
        .eq('id', session.id);

      return NextResponse.json(
        {
          success: false,
          error: 'La sesión expiró. Por favor intente nuevamente',
        } as SessionResponse,
        { status: 410 }
      );
    }

    console.log('[session] Session retrieved successfully:', {
      id: session.id,
      status: session.status,
    });

    return NextResponse.json(
      {
        success: true,
        session: {
          id: session.id,
          userId: session.user_id,
          orderNumber: session.order_number,
          paymentLinkCode: session.payment_link_code,
          addressId: session.address_id,
          shippingMethod: session.shipping_method,
          cartSnapshot: session.cart_snapshot,
          amount: parseFloat(session.amount),
          status: session.status,
          createdAt: session.created_at,
          expiresAt: session.expires_at,
          completedAt: session.completed_at,
        } as CheckoutSession,
      } as SessionResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('[session] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar la solicitud',
      } as SessionResponse,
      { status: 500 }
    );
  }
}
