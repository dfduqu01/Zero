import { sendGridClient } from './sendgrid-client';

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  total: string;
  subtotal: string;
  lensesCost: string;
  shippingCost: string;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    price: string;
    hasPrescription: boolean;
  }>;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateProvince: string;
    postalCode: string;
    country: string;
  };
}

interface ShippingEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDelivery: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    city: string;
    country: string;
  };
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  const templateId = process.env.SENDGRID_TEMPLATE_ORDER_CONFIRMATION;

  if (!templateId) {
    console.error('[Email] Order confirmation template ID not configured');
    return false;
  }

  console.log('[Email] Sending order confirmation for:', data.orderNumber);

  return sendGridClient.sendEmail({
    to: data.customerEmail,
    templateId,
    dynamicData: {
      customerName: data.customerName,
      orderNumber: data.orderNumber,
      orderDate: data.orderDate,
      total: data.total,
      subtotal: data.subtotal,
      lensesCost: data.lensesCost,
      shippingCost: data.shippingCost,
      items: data.items,
      shippingAddress: data.shippingAddress,
    },
  });
}

export async function sendOrderShippedEmail(data: ShippingEmailData): Promise<boolean> {
  const templateId = process.env.SENDGRID_TEMPLATE_ORDER_SHIPPED;

  if (!templateId) {
    console.error('[Email] Order shipped template ID not configured');
    return false;
  }

  console.log('[Email] Sending shipping notification for:', data.orderNumber);

  return sendGridClient.sendEmail({
    to: data.customerEmail,
    templateId,
    dynamicData: {
      customerName: data.customerName,
      orderNumber: data.orderNumber,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      trackingUrl: data.trackingUrl,
      estimatedDelivery: data.estimatedDelivery,
      items: data.items,
      shippingAddress: data.shippingAddress,
    },
  });
}
