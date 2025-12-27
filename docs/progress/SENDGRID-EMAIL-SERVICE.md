11# SendGrid Email Service - Implementation Plan

**Date**: December 27, 2025
**Status**: ⚠️ Phase 1 - 80% Complete (Needs Email Template Updates)
**Project**: ZERO E-commerce Email System
**Service**: SendGrid (Existing Account)
**API Key**: Configured ✅
**From Email**: zyro.online.la@gmail.com ✅

---

## ✅ Session Progress (December 27, 2025)

### Completed Items

#### 1. SendGrid Infrastructure (100% Complete)
- ✅ Installed `@sendgrid/mail` npm package
- ✅ Created `/lib/email/sendgrid-client.ts` - SendGrid API wrapper
- ✅ Created `/lib/email/email-service.ts` - Email service functions
- ✅ Added environment variables to `.env.local`:
  - `SENDGRID_API_KEY` - Configured
  - `EMAIL_FROM_ADDRESS` - zyro.online.la@gmail.com
  - `EMAIL_FROM_NAME` - Zyro Online
  - `SENDGRID_TEMPLATE_ORDER_CONFIRMATION` - d-717922b773cf45c9aec5e533e385dc0c
  - `SENDGRID_TEMPLATE_ORDER_SHIPPED` - d-a47f4deaae4c4fcdb90b6ca700fa241d
- ✅ Updated `.env.example` with SendGrid configuration template

#### 2. Email Templates in SendGrid (100% Complete)
- ✅ Created "ZERO - Confirmación de Pedido" template (ID: d-717922b773cf45c9aec5e533e385dc0c)
- ✅ Created "ZERO - Pedido Enviado" template (ID: d-a47f4deaae4c4fcdb90b6ca700fa241d)
- ✅ Templates use HTML with basic order information
- ⚠️ **NEEDS UPDATE**: Templates missing detailed prescription breakdown and pricing

#### 3. Order Confirmation Email Integration (100% Complete)
- ✅ Integrated in `/app/api/checkout/payment-callback/route.ts`
- ✅ Sends automatically after successful payment
- ✅ Includes: order number, items, shipping address, pricing
- ✅ Tested and confirmed delivery to customer email

#### 4. Shipping Notification Email Integration (100% Complete)
- ✅ Created API route: `/app/api/orders/[id]/send-shipped-email/route.ts`
- ✅ Integrated in admin form: `/app/admin/orders/[id]/OrderStatusForm.tsx`
- ✅ Sends when admin marks order as "shipped" with tracking info
- ✅ Includes: tracking number, carrier, estimated delivery

#### 5. Bug Fixes (In Progress)
- ⚠️ **CRITICAL BUG FOUND**: Prescription data not saving to `order_item_prescriptions` table
  - **Cause**: Column mismatch errors (`cart_item_id`, `prescription_image_uploaded_at`)
  - **Status**: Fixed field mapping in payment callback
  - **Next**: Needs one more test to confirm fix works

### Known Issues

#### Issue #1: Prescription Data Not Saving (CRITICAL)
**File**: `/app/api/checkout/payment-callback/route.ts:182-223`

**Problem**: When copying prescription data from cart to order, getting PostgreSQL errors:
- First error: `Could not find the 'cart_item_id' column`
- Second error: `Could not find the 'prescription_image_uploaded_at' column`

**Root Cause**:
- Cart prescriptions include fields that don't exist in `order_item_prescriptions` table
- Was using spread operator `...cartItem.prescription` which includes all fields

**Fix Applied** (lines 196-214):
```typescript
// Only include fields that exist in order_item_prescriptions table
return {
  order_item_id: orderItem.id,
  prescription_type_id: presc.prescription_type_id,
  lens_type_id: presc.lens_type_id,
  lens_index_id: presc.lens_index_id,
  view_area_id: presc.view_area_id,
  od_sph: presc.od_sph,
  // ... other prescription formula fields
  prescription_image_url: presc.prescription_image_url,
  validation_status: 'pending',
};
```

**Status**: ⏳ Needs testing to confirm fix

#### Issue #2: Email Templates Missing Details (HIGH PRIORITY)
**Files**: SendGrid templates (d-717922b773cf45c9aec5e533e385dc0c, d-a47f4deaae4c4fcdb90b6ca700fa241d)

**Problem**: Emails only show "✓ Con prescripción" instead of detailed breakdown

**Missing Information**:
- Prescription type (Single Vision, Progressive, etc.)
- Lens type selected
- Lens index (1.50, 1.60, etc.)
- View area (if progressive)
- Price breakdown per item:
  - Base frame price
  - Lens type cost
  - Lens index cost
  - View area cost
  - Item subtotal

**Impact**: Customer doesn't know what they're paying for

**Next Steps**: See `/docs/progress/EMAIL-TEMPLATES-UPDATE-NEEDED.md`

### What Works Now
1. ✅ Emails send successfully via SendGrid
2. ✅ Order confirmation email triggers after payment
3. ✅ Shipping notification email triggers when admin updates status
4. ✅ Basic order information displays (items, total, address)
5. ✅ Email delivery confirmed (arrives in inbox, not spam)

### What Still Needs Work
1. ⚠️ Prescription data saving to database (fix ready, needs testing)
2. ⚠️ Prescription details display on order confirmation page
3. ⚠️ Prescription details display on order details page
4. ⚠️ Email templates need detailed prescription breakdown
5. ⚠️ Email templates need itemized pricing

---

## Overview

This document outlines the complete email system for ZERO e-commerce platform, combining:
1. **Transactional Emails** (P0 - Critical for MVP): Order confirmations, shipping notifications
2. **Email Marketing Campaigns** (P1 - Post-launch): Promotional campaigns with recipient filtering

**Key Decision**: Use **SendGrid Dynamic Templates** to allow non-technical team members to edit email designs without code changes.

---

## Table of Contents

1. [Prerequisites & Setup](#prerequisites--setup)
2. [Phase 1: Transactional Emails](#phase-1-transactional-emails-p0)
3. [Phase 2: Email Campaign System](#phase-2-email-campaign-system-p1)
4. [Database Schema](#database-schema)
5. [Implementation Checklist](#implementation-checklist)
6. [Testing Guide](#testing-guide)

---

## Prerequisites & Setup

### SendGrid Account Setup

**Status**: ✅ User already has SendGrid account (paid)

#### Step 1: Create Dedicated Email Address (5 minutes)

**Recommendation**: Create a dedicated email for ZERO notifications.

**Options**:
- Gmail: `zero.notifications@gmail.com`
- Outlook: `notificaciones.zero@outlook.com`
- Or any email you have access to

**Action**: Create new email address for this purpose.

---

#### Step 2: Verify Single Sender in SendGrid (5 minutes)

1. **Log in to SendGrid** → [sendgrid.com](https://sendgrid.com)
2. Go to **Settings** → **Sender Authentication** (left sidebar)
3. Click **"Verify a Single Sender"** (blue button)
4. Fill in form:
   - **From Name**: `ZERO Optical` or `ZERO`
   - **From Email**: Your dedicated email (e.g., `zero.notifications@gmail.com`)
   - **Reply To**: Same email or support email
   - **Company Address**: Your business address
   - **City**: Your city
   - **Country**: Your country (required by anti-spam laws)
5. Click **"Create"**
6. **Check your email inbox** → Click verification link
7. ✅ **Done** - Sender is verified

---

#### Step 3: Create SendGrid API Key (5 minutes)

1. In SendGrid, go to **Settings** → **API Keys**
2. Click **"Create API Key"** (top right)
3. **Name**: `ZERO E-commerce Production`
4. **Permissions**: Select **"Full Access"** (or **Restricted** → check "Mail Send")
5. Click **"Create & View"**
6. **COPY THE API KEY** - you'll only see it once!
   - Format: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
7. Save securely (password manager or `.env.local`)

---

#### Step 4: Add to Environment Variables

Add to `/zyro-app/.env.local`:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_NAME=ZERO Optical
EMAIL_FROM_ADDRESS=zero.notifications@gmail.com

# Template IDs (will add after creating templates)
SENDGRID_TEMPLATE_ORDER_CONFIRMATION=
SENDGRID_TEMPLATE_ORDER_SHIPPED=
```

---

## Phase 1: Transactional Emails (P0)

**Priority**: 🔴 Critical - Required for MVP Launch
**Timeline**: 2-3 hours implementation
**Status**: Blocks MVP launch

### Overview

Automated emails triggered by user actions:
1. **Order Confirmation** - Sent when order is created
2. **Order Shipped** - Sent when admin marks order as shipped with tracking

### 1.1 Create Email Templates in SendGrid

**You'll do this part in SendGrid dashboard:**

#### Template 1: Order Confirmation Email

**Purpose**: Confirm order was received and provide order details.

**Steps to Create**:
1. In SendGrid, go to **Email API** → **Dynamic Templates**
2. Click **"Create a Dynamic Template"**
3. **Template Name**: `ZERO - Order Confirmation`
4. Click **"Add Version"** → Choose **"Blank Template"** or **"Design Editor"**
5. **Design the email** with these variables (examples):

**Subject Line**: `Confirmación de Pedido #{{orderNumber}} - ZERO Optical`

**Email Content** (Spanish - key sections):

```
Hola {{customerName}},

¡Gracias por tu pedido!

Hemos recibido tu pedido #{{orderNumber}} y está siendo procesado.

DETALLES DEL PEDIDO:
--------------------
Número de Pedido: {{orderNumber}}
Fecha: {{orderDate}}
Total: {{total}}

PRODUCTOS:
{{#each items}}
- {{name}} ({{quantity}}x) - {{price}}
  SKU: {{sku}}
  {{#if hasPrescription}}✓ Con prescripción{{/if}}
{{/each}}

DIRECCIÓN DE ENVÍO:
{{shippingAddress.fullName}}
{{shippingAddress.addressLine1}}
{{#if shippingAddress.addressLine2}}{{shippingAddress.addressLine2}}{{/if}}
{{shippingAddress.city}}, {{shippingAddress.stateProvince}}
{{shippingAddress.postalCode}}
{{shippingAddress.country}}

RESUMEN:
Subtotal: {{subtotal}}
Lentes y Tratamientos: {{lensesCost}}
Envío: {{shippingCost}}
--------------------
TOTAL: {{total}}

Recibirás un correo de confirmación cuando tu pedido sea enviado.

¿Necesitas ayuda? Contáctanos:
Email: soporte@zerooptica.com
WhatsApp: [número]

Gracias por confiar en ZERO Optical.
```

6. **Save** and note the **Template ID** (format: `d-abc123xyz456`)
7. Copy Template ID to `.env.local` → `SENDGRID_TEMPLATE_ORDER_CONFIRMATION=d-abc123xyz456`

---

#### Template 2: Order Shipped Email

**Purpose**: Notify customer their order has shipped with tracking info.

**Steps to Create**:
1. Go to **Email API** → **Dynamic Templates** → **Create a Dynamic Template**
2. **Template Name**: `ZERO - Order Shipped`
3. **Add Version** → Design email

**Subject Line**: `Tu pedido #{{orderNumber}} ha sido enviado - ZERO Optical`

**Email Content** (Spanish):

```
Hola {{customerName}},

¡Buenas noticias! Tu pedido está en camino.

INFORMACIÓN DE ENVÍO:
--------------------
Número de Pedido: {{orderNumber}}
Transportista: {{carrier}}
Número de Rastreo: {{trackingNumber}}
Entrega Estimada: {{estimatedDelivery}}

{{#if trackingUrl}}
Rastrear tu pedido: {{trackingUrl}}
{{/if}}

ENVIADO A:
{{shippingAddress.fullName}}
{{shippingAddress.addressLine1}}
{{shippingAddress.city}}, {{shippingAddress.country}}

PRODUCTOS:
{{#each items}}
- {{name}} ({{quantity}}x)
{{/each}}

¿Necesitas ayuda? Contáctanos:
Email: soporte@zerooptica.com
WhatsApp: [número]

Gracias por tu compra.
ZERO Optical
```

4. **Save** and copy **Template ID**
5. Add to `.env.local` → `SENDGRID_TEMPLATE_ORDER_SHIPPED=d-xyz789abc123`

---

### 1.2 Implementation - SendGrid Client

**File**: `/zyro-app/lib/email/sendgrid-client.ts` (NEW)

```typescript
import sgMail from '@sendgrid/mail';

interface SendEmailParams {
  to: string;
  templateId: string;
  dynamicData: Record<string, any>;
  subject?: string; // Optional override
}

interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export class SendGridEmailClient {
  private config: SendGridConfig;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.EMAIL_FROM_ADDRESS;
    const fromName = process.env.EMAIL_FROM_NAME;

    if (!apiKey || !fromEmail || !fromName) {
      throw new Error('SendGrid configuration missing. Check environment variables.');
    }

    this.config = {
      apiKey,
      fromEmail,
      fromName,
    };

    sgMail.setApiKey(apiKey);
  }

  async sendEmail(params: SendEmailParams): Promise<boolean> {
    try {
      console.log('[SendGrid] Sending email:', {
        to: params.to,
        templateId: params.templateId,
      });

      const msg = {
        to: params.to,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName,
        },
        templateId: params.templateId,
        dynamicTemplateData: params.dynamicData,
      };

      if (params.subject) {
        // Subject override (optional)
        Object.assign(msg, { subject: params.subject });
      }

      await sgMail.send(msg);

      console.log('[SendGrid] Email sent successfully to:', params.to);
      return true;
    } catch (error: any) {
      console.error('[SendGrid] Email send failed:', {
        error: error.message,
        response: error.response?.body,
      });
      return false;
    }
  }

  async sendTestEmail(to: string, templateId: string, dynamicData: Record<string, any>): Promise<boolean> {
    console.log('[SendGrid] Sending test email to:', to);
    return this.sendEmail({ to, templateId, dynamicData });
  }
}

// Export singleton instance
export const sendGridClient = new SendGridEmailClient();
```

---

### 1.3 Email Service Functions

**File**: `/zyro-app/lib/email/email-service.ts` (NEW)

```typescript
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
```

---

### 1.4 Integration Points

#### A. Order Confirmation - After Order Creation

**File**: `/zyro-app/app/api/checkout/create-payment-link/route.ts` or order creation endpoint

**When**: After order is successfully created in database.

```typescript
import { sendOrderConfirmationEmail } from '@/lib/email/email-service';

// After order creation
const emailData = {
  orderNumber: order.order_number,
  customerName: user.name,
  customerEmail: user.email,
  orderDate: new Date(order.created_at).toLocaleDateString('es-ES'),
  total: `$${order.total.toFixed(2)}`,
  subtotal: `$${order.subtotal.toFixed(2)}`,
  lensesCost: `$${order.treatments_cost.toFixed(2)}`,
  shippingCost: `$${order.shipping_cost.toFixed(2)}`,
  items: orderItems.map(item => ({
    name: item.product_snapshot.name,
    sku: item.product_snapshot.sku,
    quantity: item.quantity,
    price: `$${item.unit_price.toFixed(2)}`,
    hasPrescription: !!item.prescription,
  })),
  shippingAddress: {
    fullName: address.full_name,
    addressLine1: address.address_line_1,
    addressLine2: address.address_line_2,
    city: address.city,
    stateProvince: address.state_province,
    postalCode: address.postal_code,
    country: address.country,
  },
};

// Send email (non-blocking - don't wait for it)
sendOrderConfirmationEmail(emailData).catch(err =>
  console.error('Failed to send order confirmation email:', err)
);
```

---

#### B. Shipping Notification - When Order Status Updated

**File**: `/zyro-app/app/admin/orders/[id]/OrderStatusForm.tsx` or API route

**When**: Admin updates order status to "shipped" with tracking number.

```typescript
import { sendOrderShippedEmail } from '@/lib/email/email-service';

// After updating order status to "shipped"
if (newStatus === 'shipped' && trackingNumber) {
  const emailData = {
    orderNumber: order.order_number,
    customerName: user.name,
    customerEmail: user.email,
    carrier: trackingCarrier || 'Transportista',
    trackingNumber,
    trackingUrl: trackingUrl, // Optional
    estimatedDelivery: estimatedDelivery
      ? new Date(estimatedDelivery).toLocaleDateString('es-ES')
      : 'Por confirmar',
    items: orderItems.map(item => ({
      name: item.product_snapshot.name,
      quantity: item.quantity,
    })),
    shippingAddress: {
      fullName: shippingAddress.full_name,
      addressLine1: shippingAddress.address_line_1,
      city: shippingAddress.city,
      country: shippingAddress.country,
    },
  };

  sendOrderShippedEmail(emailData).catch(err =>
    console.error('Failed to send shipping notification:', err)
  );
}
```

---

### 1.5 Install Dependencies

**Package to install**:

```bash
npm install @sendgrid/mail
```

**TypeScript types** (if needed):

```bash
npm install --save-dev @types/sendgrid__mail
```

---

## Phase 2: Email Campaign System (P1)

**Priority**: 🟡 Post-Launch Feature
**Timeline**: 1 day implementation
**Status**: Can be built after MVP launch

### Overview

Admin-controlled email marketing campaigns with recipient filtering:
- Create campaigns in admin panel
- Use SendGrid Dynamic Templates (created in SendGrid dashboard)
- Filter recipients by country and order history
- Preview recipient count before sending
- Send test emails
- Send to all filtered recipients immediately

**No analytics in platform** - admin checks open/click rates directly in SendGrid dashboard.

---

### 2.1 Database Schema

#### Table: `email_campaigns`

**Purpose**: Store marketing campaign information.

```sql
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sendgrid_template_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),

  -- Filters stored as JSON
  filters JSONB NOT NULL DEFAULT '{}',
  -- Example: {"countries": ["MX", "CO"], "hasOrders": true}

  recipient_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,

  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_created_by ON email_campaigns(created_by);
CREATE INDEX idx_email_campaigns_created_at ON email_campaigns(created_at DESC);

-- RLS Policies
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- Admins can view all campaigns
CREATE POLICY "Admins can view campaigns"
  ON email_campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Admins can create campaigns
CREATE POLICY "Admins can create campaigns"
  ON email_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Admins can update draft campaigns
CREATE POLICY "Admins can update draft campaigns"
  ON email_campaigns FOR UPDATE
  TO authenticated
  USING (
    status = 'draft' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Admins can delete draft campaigns
CREATE POLICY "Admins can delete draft campaigns"
  ON email_campaigns FOR DELETE
  TO authenticated
  USING (
    status = 'draft' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );
```

---

### 2.2 Filter Types

**Supported Filters**:

```typescript
interface CampaignFilters {
  // Country filter (required)
  countries: string[]; // ['MX', 'CO', 'PA', 'CR', etc.]

  // Order history filter
  hasOrders?: boolean; // true = only users with orders, false = only users without orders
}
```

**Examples**:

```json
// Campaign 1: All users in Mexico and Colombia
{
  "countries": ["MX", "CO"]
}

// Campaign 2: Users in Panama who have placed orders
{
  "countries": ["PA"],
  "hasOrders": true
}

// Campaign 3: New users (no orders yet) in all countries
{
  "countries": ["MX", "CO", "PA", "CR", "GT", "SV", "HN", "NI"],
  "hasOrders": false
}
```

---

### 2.3 Admin UI - Campaigns List

**Route**: `/admin/campaigns`
**File**: `/zyro-app/app/admin/campaigns/page.tsx` (NEW)

**Features**:
- Table showing all campaigns
- Filter by status (All, Draft, Sent)
- Actions: Edit (draft only), Delete (draft only), View details

**Table Columns**:
- Name
- Template ID
- Status (badge)
- Recipients
- Sent Date
- Actions

**Sample UI Structure**:

```tsx
// /app/admin/campaigns/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CampaignsClient from './CampaignsClient';

export default async function CampaignsPage() {
  const supabase = await createClient();

  // Check auth and admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirectTo=/admin/campaigns');

  const { data: userProfile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!userProfile?.is_admin) redirect('/');

  // Fetch campaigns
  const { data: campaigns } = await supabase
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  return <CampaignsClient campaigns={campaigns || []} />;
}
```

---

### 2.4 Admin UI - Create Campaign

**Route**: `/admin/campaigns/new`
**File**: `/zyro-app/app/admin/campaigns/new/page.tsx` (NEW)

**Form Fields**:

1. **Campaign Name** (text input)
   - Example: "Promoción Navidad 2025"

2. **SendGrid Template ID** (text input)
   - Example: "d-abc123xyz456"
   - Helper text: "Create template in SendGrid dashboard first, then paste ID here"

3. **Email Subject** (text input)
   - Example: "🎄 ¡50% de descuento en todas las gafas de sol!"

4. **Filter: Countries** (checkbox list)
   - ☑️ México (MX)
   - ☑️ Colombia (CO)
   - ☑️ Panamá (PA)
   - ☑️ Costa Rica (CR)
   - ☑️ Guatemala (GT)
   - ☑️ El Salvador (SV)
   - ☑️ Honduras (HN)
   - ☑️ Nicaragua (NI)

5. **Filter: Order History** (radio buttons)
   - ⚫ Todos los usuarios
   - ⚫ Solo usuarios con pedidos
   - ⚫ Solo usuarios sin pedidos

6. **Actions**:
   - Button: "Vista Previa de Destinatarios" → Shows count
   - Button: "Enviar Email de Prueba" → Sends to admin's email
   - Button: "Enviar Campaña Ahora" → Sends to all filtered recipients
   - Button: "Guardar como Borrador" → Saves without sending

---

### 2.5 API Routes

#### A. Create Campaign

**File**: `/zyro-app/app/api/admin/campaigns/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userProfile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { name, sendgridTemplateId, subject, filters } = body;

    // Validation
    if (!name || !sendgridTemplateId || !subject || !filters) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create campaign
    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .insert({
        name,
        sendgrid_template_id: sendgridTemplateId,
        subject,
        filters,
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error: any) {
    console.error('[API] Create campaign failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userProfile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch campaigns
    const { data: campaigns, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error('[API] Fetch campaigns failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

#### B. Preview Recipients

**File**: `/zyro-app/app/api/admin/campaigns/preview/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface CampaignFilters {
  countries: string[];
  hasOrders?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userProfile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse filters
    const { filters } = await request.json() as { filters: CampaignFilters };

    // Build query
    let query = supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    // Apply country filter
    if (filters.countries && filters.countries.length > 0) {
      query = query.in('country', filters.countries);
    }

    // Apply order history filter
    if (filters.hasOrders === true) {
      // Only users with orders
      query = query.filter('id', 'in', `(
        SELECT DISTINCT user_id FROM orders
      )`);
    } else if (filters.hasOrders === false) {
      // Only users without orders
      query = query.filter('id', 'not.in', `(
        SELECT DISTINCT user_id FROM orders
      )`);
    }

    const { count, error } = await query;

    if (error) throw error;

    return NextResponse.json({ count: count || 0 });
  } catch (error: any) {
    console.error('[API] Preview recipients failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

#### C. Send Test Email

**File**: `/zyro-app/app/api/admin/campaigns/send-test/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendGridClient } from '@/lib/email/sendgrid-client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userProfile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request
    const { sendgridTemplateId, testData } = await request.json();

    if (!sendgridTemplateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    // Send test email to admin's email
    const success = await sendGridClient.sendTestEmail(
      user.email!,
      sendgridTemplateId,
      testData || { name: 'Test User', orderNumber: 'TEST-12345' }
    );

    if (!success) {
      return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Test email sent successfully' });
  } catch (error: any) {
    console.error('[API] Send test email failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

#### D. Send Campaign

**File**: `/zyro-app/app/api/admin/campaigns/[id]/send/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendGridClient } from '@/lib/email/sendgrid-client';

interface CampaignFilters {
  countries: string[];
  hasOrders?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userProfile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', params.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === 'sent') {
      return NextResponse.json({ error: 'Campaign already sent' }, { status: 400 });
    }

    // Get recipients based on filters
    const filters = campaign.filters as CampaignFilters;

    let query = supabase
      .from('users')
      .select('id, email, name, country');

    // Apply country filter
    if (filters.countries && filters.countries.length > 0) {
      query = query.in('country', filters.countries);
    }

    // Apply order history filter (simplified - would need join in production)
    if (filters.hasOrders !== undefined) {
      // This is a simplified version - in production, use proper join
      // For now, we'll fetch all users and filter after
    }

    const { data: recipients, error: recipientsError } = await query;

    if (recipientsError) throw recipientsError;

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 });
    }

    // Send emails (batch send)
    console.log(`[Campaign] Sending to ${recipients.length} recipients`);

    let successCount = 0;
    let failCount = 0;

    // SendGrid supports batch sends - send in batches of 1000
    const batchSize = 1000;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const emailPromises = batch.map(recipient =>
        sendGridClient.sendEmail({
          to: recipient.email!,
          templateId: campaign.sendgrid_template_id,
          dynamicData: {
            name: recipient.name || 'Cliente',
            // Add any other dynamic data here
          },
        })
      );

      const results = await Promise.allSettled(emailPromises);

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          successCount++;
        } else {
          failCount++;
        }
      });
    }

    // Update campaign status
    const { error: updateError } = await supabase
      .from('email_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipient_count: successCount,
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('[Campaign] Failed to update campaign status:', updateError);
    }

    return NextResponse.json({
      message: 'Campaign sent',
      successCount,
      failCount,
      totalRecipients: recipients.length,
    });
  } catch (error: any) {
    console.error('[API] Send campaign failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### 2.6 Campaign Email Templates

**Admin creates these in SendGrid dashboard** (same process as transactional emails).

**Example Campaign Template Variables**:

```handlebars
Hola {{name}},

[Campaign content here - created in SendGrid visual editor]

¡No te pierdas esta oportunidad!

ZERO Optical

---
¿No quieres recibir más promociones? [Darse de baja]({{unsubscribeUrl}})
```

**Note**: SendGrid automatically provides `{{unsubscribeUrl}}` if you enable Subscription Tracking in SendGrid settings.

---

## Database Schema

### Migration File

**File**: `/zyro-app/supabase/migrations/YYYYMMDD_email_campaigns.sql` (NEW)

```sql
-- Email Campaigns Table
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sendgrid_template_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  filters JSONB NOT NULL DEFAULT '{}',
  recipient_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_created_by ON email_campaigns(created_by);
CREATE INDEX idx_email_campaigns_created_at ON email_campaigns(created_at DESC);

-- RLS Policies
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view campaigns"
  ON email_campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can create campaigns"
  ON email_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update draft campaigns"
  ON email_campaigns FOR UPDATE
  TO authenticated
  USING (
    status = 'draft' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can delete draft campaigns"
  ON email_campaigns FOR DELETE
  TO authenticated
  USING (
    status = 'draft' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );
```

---

## Implementation Checklist

### Phase 1: Transactional Emails (P0)

#### Prerequisites
- [ ] Create dedicated email address (e.g., `zero.notifications@gmail.com`)
- [ ] Verify single sender in SendGrid
- [ ] Create SendGrid API key
- [ ] Add credentials to `.env.local`

#### SendGrid Dashboard
- [ ] Create "Order Confirmation" template in SendGrid
- [ ] Copy Template ID to `.env.local`
- [ ] Create "Order Shipped" template in SendGrid
- [ ] Copy Template ID to `.env.local`

#### Code Implementation
- [ ] Install `@sendgrid/mail` package
- [ ] Create `/lib/email/sendgrid-client.ts`
- [ ] Create `/lib/email/email-service.ts`
- [ ] Integrate order confirmation email in order creation flow
- [ ] Integrate shipping notification in order status update flow

#### Testing
- [ ] Test order confirmation email (place test order)
- [ ] Test shipping notification (update order to shipped)
- [ ] Verify emails arrive in inbox (not spam)
- [ ] Verify email content displays correctly
- [ ] Test email on mobile devices

---

### Phase 2: Email Campaigns (P1)

#### Database
- [ ] Create migration for `email_campaigns` table
- [ ] Run migration on database
- [ ] Verify RLS policies work

#### Admin UI - Campaigns List
- [ ] Create `/app/admin/campaigns/page.tsx`
- [ ] Create `/app/admin/campaigns/CampaignsClient.tsx`
- [ ] Display campaigns table
- [ ] Add filter by status (All/Draft/Sent)
- [ ] Add actions (Edit/Delete for drafts)
- [ ] Add "Create Campaign" button

#### Admin UI - Create Campaign
- [ ] Create `/app/admin/campaigns/new/page.tsx`
- [ ] Create campaign form component
- [ ] Add campaign name input
- [ ] Add Template ID input
- [ ] Add subject input
- [ ] Add countries filter (checkboxes)
- [ ] Add order history filter (radio buttons)
- [ ] Add preview recipients button
- [ ] Add send test email button
- [ ] Add send campaign button
- [ ] Add save as draft button

#### API Routes
- [ ] Create `/app/api/admin/campaigns/route.ts` (GET, POST)
- [ ] Create `/app/api/admin/campaigns/preview/route.ts` (POST)
- [ ] Create `/app/api/admin/campaigns/send-test/route.ts` (POST)
- [ ] Create `/app/api/admin/campaigns/[id]/send/route.ts` (POST)

#### Testing
- [ ] Create test campaign (draft)
- [ ] Preview recipients count
- [ ] Send test email to admin
- [ ] Send campaign to filtered users
- [ ] Verify emails arrive
- [ ] Check SendGrid analytics
- [ ] Test with different filter combinations

---

## Testing Guide

### Phase 1: Transactional Emails

#### Test 1: Order Confirmation Email

**Steps**:
1. Place a test order on the platform
2. Complete checkout flow
3. Check email inbox

**Expected Result**:
- ✅ Email arrives within 1-2 minutes
- ✅ Subject line correct: "Confirmación de Pedido #ZERO-2025-XXXXX"
- ✅ Order number, total, items display correctly
- ✅ Shipping address displays correctly
- ✅ Email is in Spanish
- ✅ From address is your verified sender
- ✅ Email doesn't go to spam

**Troubleshooting**:
- If email doesn't arrive: Check SendGrid Activity dashboard for errors
- If goes to spam: Check SendGrid sender reputation, consider domain authentication
- If data incorrect: Verify `dynamicTemplateData` in code matches template variables

---

#### Test 2: Shipping Notification Email

**Steps**:
1. Go to admin panel → Orders
2. Select an order
3. Update status to "Shipped"
4. Add tracking number
5. Save
6. Check customer's email inbox

**Expected Result**:
- ✅ Email arrives within 1-2 minutes
- ✅ Subject line correct: "Tu pedido #ZERO-2025-XXXXX ha sido enviado"
- ✅ Tracking number displays
- ✅ Estimated delivery date shows
- ✅ Email is in Spanish

---

### Phase 2: Email Campaigns

#### Test 1: Create Campaign

**Steps**:
1. Go to admin panel → Campaigns
2. Click "Create Campaign"
3. Fill in form:
   - Name: "Test Campaign"
   - Template ID: (from SendGrid)
   - Subject: "Test Email"
   - Countries: Select México
   - Order history: All users
4. Click "Save as Draft"

**Expected Result**:
- ✅ Campaign saves successfully
- ✅ Appears in campaigns list with status "Draft"

---

#### Test 2: Preview Recipients

**Steps**:
1. In create campaign form, configure filters
2. Click "Preview Recipients"

**Expected Result**:
- ✅ Shows count (e.g., "247 recipients")
- ✅ Count updates when filters change
- ✅ Count is 0 if no matching users

---

#### Test 3: Send Test Email

**Steps**:
1. In create campaign form
2. Click "Send Test Email"
3. Check your email (admin email)

**Expected Result**:
- ✅ Test email arrives
- ✅ Uses SendGrid template
- ✅ Template renders correctly

---

#### Test 4: Send Campaign

**Steps**:
1. Create campaign with filter (e.g., 1-2 test users)
2. Click "Send Campaign Now"
3. Confirm
4. Check recipients' emails

**Expected Result**:
- ✅ Campaign status changes to "Sent"
- ✅ Recipient count updates
- ✅ Sent date shows
- ✅ Emails arrive to filtered users
- ✅ Non-matching users don't receive email

---

## Troubleshooting

### Common Issues

#### Issue 1: "SendGrid configuration missing"

**Cause**: Environment variables not set correctly.

**Fix**:
```bash
# Check .env.local has:
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM_ADDRESS=your-email@example.com
EMAIL_FROM_NAME=ZERO Optical
```

Restart dev server after adding.

---

#### Issue 2: Emails go to spam

**Cause**: Using unverified domain or generic email provider.

**Fix**:
- Short-term: Ask recipients to mark as "Not Spam"
- Long-term: Set up domain authentication (see Prerequisites section)

---

#### Issue 3: "Template not found" error

**Cause**: Template ID incorrect or template deleted in SendGrid.

**Fix**:
1. Go to SendGrid → Email API → Dynamic Templates
2. Find your template
3. Click template name → Copy ID
4. Verify ID in `.env.local` matches exactly

---

#### Issue 4: Email not sending (no error)

**Cause**: API call failing silently.

**Fix**:
1. Check server logs for SendGrid errors
2. Check SendGrid Activity dashboard (last 7 days of sends)
3. Verify API key has "Mail Send" permission

---

#### Issue 5: Dynamic data not rendering in email

**Cause**: Variable names in template don't match `dynamicTemplateData`.

**Fix**:
- Template uses: `{{orderNumber}}`
- Code must send: `{ orderNumber: "ZERO-2025-12345" }`
- Names must match exactly (case-sensitive)

---

## Next Steps

### After Completing Phase 1 (Transactional Emails):

1. **Test thoroughly** with real orders
2. **Monitor SendGrid dashboard** for delivery issues
3. **Update email templates** as needed (no code changes required)
4. **Consider domain authentication** for better deliverability (before launch)

### After Completing Phase 2 (Campaigns):

1. **Train admin users** on creating campaigns
2. **Create campaign templates** in SendGrid for common promotions
3. **Set up unsubscribe groups** in SendGrid (optional)
4. **Monitor campaign performance** in SendGrid analytics

---

## Resources

### SendGrid Documentation
- Dashboard: https://app.sendgrid.com
- Dynamic Templates Guide: https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-templates
- API Reference: https://docs.sendgrid.com/api-reference/mail-send/mail-send

### Project Files
- Implementation Plan: `/docs/progress/IMPLEMENTATION-PLAN.md`
- Database Schema: `/docs/DATABASE-SCHEMA.md`
- PagueloFacil Docs: `/docs/PAGUELOFACIL-DOCS.md`

---

**Document Version**: 1.0
**Last Updated**: December 19, 2025
**Status**: Planning Phase - Ready for Implementation
**Next Action**: Complete SendGrid prerequisites, then implement Phase 1
