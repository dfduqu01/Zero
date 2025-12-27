/**
 * API Route: Send Order Shipped Email
 * POST /api/orders/[id]/send-shipped-email
 *
 * Sends shipping notification email to customer when order is marked as shipped.
 * Called from admin panel after updating order status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderShippedEmail } from '@/lib/email/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userProfile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        user:users(name, id),
        shipping_address:addresses(*)
      `)
      .eq('id', params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate order has shipping info
    if (!order.tracking_number || !order.tracking_carrier) {
      return NextResponse.json(
        { error: 'Order missing tracking information' },
        { status: 400 }
      );
    }

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('quantity, product_snapshot')
      .eq('order_id', params.id);

    if (itemsError) {
      return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 });
    }

    // Get customer email from auth
    const { data: customer } = await supabase.auth.admin.getUserById(order.user.id);

    if (!customer.user?.email) {
      return NextResponse.json({ error: 'Customer email not found' }, { status: 404 });
    }

    // Prepare email data
    const emailData = {
      orderNumber: order.order_number,
      customerName: order.user.name,
      customerEmail: customer.user.email,
      carrier: order.tracking_carrier,
      trackingNumber: order.tracking_number,
      trackingUrl: undefined, // Could add tracking URL generation logic here
      estimatedDelivery: order.estimated_delivery_date
        ? new Date(order.estimated_delivery_date).toLocaleDateString('es-ES')
        : 'Por confirmar',
      items: orderItems?.map((item: any) => ({
        name: item.product_snapshot?.name || 'Unknown Product',
        quantity: item.quantity,
      })) || [],
      shippingAddress: {
        fullName: order.shipping_address.full_name,
        addressLine1: order.shipping_address.address_line_1,
        city: order.shipping_address.city,
        country: order.shipping_address.country,
      },
    };

    // Send email
    const success = await sendOrderShippedEmail(emailData);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Shipping notification email sent successfully',
    });
  } catch (error) {
    console.error('[send-shipped-email] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
