# PagueloFacil Payment Gateway Integration Plan (REVISED)

**Date Created**: December 11, 2025
**Date Revised**: December 12, 2025
**Status**: 🔄 REFACTORING - Redirect Flow Implementation
**Priority**: 🔴 CRITICAL - Blocks MVP Launch
**Estimated Time**: 4-6 hours (refactor)

---

## ⚠️ CRITICAL DISCOVERY (December 12, 2025)

**Previous Approach (INCORRECT)**: ❌
- We implemented a direct API integration where card details are collected on our site
- Used endpoint: `https://sandbox.paguelofacil.com/rest/auto/charge`
- This endpoint **does not exist** (404 error)

**Correct Approach (OFFICIAL)**: ✅
- PagueloFacil uses a **REDIRECT-BASED** payment flow (like PayPal/Stripe Checkout)
- Users enter card details on PagueloFacil's hosted checkout page
- More secure, PCI-compliant by default, simpler implementation

---

## Executive Summary

This document outlines the **REVISED** implementation plan for integrating PagueloFacil (Panama) payment gateway into the ZERO e-commerce platform. The integration follows PagueloFacil's official redirect-based flow.

**Key Decision**: **REDIRECT FLOW** (user redirected to PagueloFacil's secure checkout page)

---

## Business Context

### Current State
- Checkout flow is 100% complete EXCEPT payment processing
- **WRONG implementation completed** (direct API with card collection)
  - ✅ Created payment types
  - ✅ Created PagueloFacil client (needs refactor)
  - ✅ Created API route (needs complete rewrite)
  - ✅ Created CardInputForm (will be REMOVED)
  - ✅ Modified CheckoutClient (needs refactor)
- Testing revealed 404 error - endpoint doesn't exist
- Discovered official docs use redirect flow

### Desired State
- Users can pay with VISA/Mastercard, Nequi, Cash, Clave, Crypto
- Payment processed BEFORE order creation
- Failed payments keep cart intact and allow retry
- Transaction ID stored for reconciliation and refunds
- **User never sees card form on our site** (PagueloFacil handles it)

---

## Architecture Overview - CORRECT FLOW

### Payment Flow Diagram (Redirect-Based)

```
User Cart with Items
    ↓
Checkout Step 1: Shipping Address
    ↓
Checkout Step 2: Shipping Method
    ↓
Checkout Step 3: Review Order (NO payment step anymore)
    ↓
User Clicks "Pagar y Confirmar Pedido"
    ↓
POST /api/checkout/create-payment-link (Server-side)
    ├─ Validate authentication
    ├─ Calculate total amount
    ├─ Generate order number (pre-create)
    ├─ Call LinkDeamon.cfm to get payment URL
    └─ Return payment URL to client
    ↓
Frontend redirects user → https://checkout.paguelofacil.com?code=LK-XXXXX
    ↓
User enters payment on PagueloFacil's page
(VISA, Mastercard, Nequi, Cash, Clave, Crypto)
    ↓
Payment Successful?
    YES → PagueloFacil redirects to RETURN_URL
        → /api/checkout/payment-callback?status=success&code=LK-XXX&tx=TX-XXX
        → Verify payment status
        → Create order in database with transaction_id
        → Create order items
        → Create prescription records
        → Clear cart
        → Redirect to /orders/[id]/confirmation
    NO → PagueloFacil redirects to RETURN_URL
        → /api/checkout/payment-callback?status=failed&code=LK-XXX
        → Show error message
        → Redirect back to checkout with error
        → Cart stays intact
        → User can retry
```

### Technology Stack
- **Frontend**: React (Next.js 16), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (server-side)
- **Payment Gateway**: PagueloFacil LinkDeamon API (Panama)
- **Database**: Supabase (PostgreSQL)
- **Environment**: Sandbox → Production

---

## Official PagueloFacil API - LinkDeamon Flow

### Step 1: Create Payment Link

**Endpoint**: `https://secure.paguelofacil.com/LinkDeamon.cfm`
**Method**: POST (application/x-www-form-urlencoded)

**Request Parameters**:
```
CCLW=B3B42F50E474663C6E508CA8DFA9869BC0FBA03E9E6650226DDFBCC38F55C4CF2C190251E1793674A96149D931DC08E5FBB33255D2D83654DF669538BE6B6B9B
CMTN=149.99
CDSC=ZERO Optical - Order #ZERO-2025-00123
CTAX=0.00
RETURN_URL=687474703A2F2F6C6F63616C686F73743A333030302F6170692F636865636B6F75742F7061796D656E742D63616C6C6261636B (hex encoded)
PARM_1=ZERO-2025-00123 (our order number for tracking)
EXPIRES_IN=3600 (1 hour)
CARD_TYPE=VISA,MASTERCARD (optional - restrict payment methods)
```

**Response** (Success):
```json
{
  "headerStatus": {
    "code": 200,
    "description": "Success"
  },
  "serverTime": "2025-12-12T12:00:00",
  "message": "Success",
  "data": {
    "url": "https://checkout.paguelofacil.com?code=LK-RQC5CO5G3TLNNJUU",
    "code": "LK-RQC5CO5G3TLNNJUU"
  },
  "success": true
}
```

**IMPORTANT**: Each URL is single-use only. Must generate new link for each payment attempt.

### Step 2: Redirect User

Frontend receives payment URL and redirects:
```typescript
window.location.href = paymentUrl; // Redirect to PagueloFacil
```

### Step 3: Handle Callback

PagueloFacil redirects back to RETURN_URL with query parameters:

**Success Callback**:
```
https://yoursite.com/api/checkout/payment-callback?
  status=success&
  code=LK-RQC5CO5G3TLNNJUU&
  tx=TX-ABC123XYZ789&
  PARM_1=ZERO-2025-00123
```

**Failed Callback**:
```
https://yoursite.com/api/checkout/payment-callback?
  status=failed&
  code=LK-RQC5CO5G3TLNNJUU&
  PARM_1=ZERO-2025-00123&
  error=Pago+rechazado
```

---

## Files to Modify/Create

### 1. ❌ DELETE: `/zyro-app/components/CardInputForm.tsx`
**Reason**: No longer needed - PagueloFacil handles card collection
**Action**: Delete entire file

### 2. 🔄 REFACTOR: `/zyro-app/lib/types/payment.ts`
**Current**: Has CardDetails, direct API types
**New**: Add redirect flow types, remove card-related types

**Add these types**:
```typescript
// LinkDeamon Request
export interface CreatePaymentLinkRequest {
  amount: number;
  taxAmount: number;
  description: string;
  returnUrl: string;
  orderNumber: string; // PARM_1
  expiresIn?: number; // Default 3600
  cardTypes?: string; // "VISA,MASTERCARD,NEQUI"
}

// LinkDeamon Response
export interface CreatePaymentLinkResponse {
  success: boolean;
  data?: {
    url: string; // Payment URL to redirect to
    code: string; // Payment link code (LK-XXX)
  };
  headerStatus: {
    code: number;
    description: string;
  };
  serverTime: string;
  message: string;
}

// Payment Callback Query Params
export interface PaymentCallbackParams {
  status: 'success' | 'failed';
  code: string; // LK-XXX
  tx?: string; // Transaction ID (only on success)
  PARM_1: string; // Our order number
  error?: string; // Error message (only on failure)
}
```

**Remove these types**:
- `CardDetails` - Not needed anymore
- `CardValidationResult` - Not needed
- Direct API request/response types

### 3. 🔄 REFACTOR: `/zyro-app/lib/payment/paguelofacil-client.ts`
**Current**: Has `authorizeAndCapture()` method for direct API
**New**: Replace with `createPaymentLink()` method

**New Implementation**:
```typescript
export class PagueloFacilClient {
  private config: Required<PagueloFacilConfig>;
  private linkDaemonUrl = 'https://secure.paguelofacil.com/LinkDeamon.cfm';

  /**
   * Create a payment link for redirect-based checkout
   */
  async createPaymentLink(
    request: CreatePaymentLinkRequest
  ): Promise<CreatePaymentLinkResponse> {
    // Convert returnUrl to hex
    const returnUrlHex = Buffer.from(request.returnUrl).toString('hex').toUpperCase();

    // Build form data (application/x-www-form-urlencoded)
    const formData = new URLSearchParams({
      CCLW: this.config.cclw,
      CMTN: request.amount.toFixed(2),
      CDSC: request.description,
      CTAX: request.taxAmount.toFixed(2),
      RETURN_URL: returnUrlHex,
      PARM_1: request.orderNumber,
      EXPIRES_IN: String(request.expiresIn || 3600),
    });

    if (request.cardTypes) {
      formData.append('CARD_TYPE', request.cardTypes);
    }

    // Make request
    const response = await fetch(this.linkDaemonUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
      },
      body: formData.toString(),
    });

    const data = await response.json();
    return data;
  }
}
```

### 4. 🆕 CREATE: `/zyro-app/app/api/checkout/create-payment-link/route.ts`
**Purpose**: Server-side endpoint to create PagueloFacil payment link

**Flow**:
```typescript
export async function POST(request: NextRequest) {
  // 1. Check authentication
  const { user } = await supabase.auth.getUser();
  if (!user) return 401;

  // 2. Parse request body
  const { amount, orderNumber, description } = await request.json();

  // 3. Validate inputs
  if (!amount || !orderNumber) return 400;

  // 4. Create payment link
  const client = createPagueloFacilClient();
  const result = await client.createPaymentLink({
    amount,
    taxAmount: 0,
    description,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/checkout/payment-callback`,
    orderNumber,
    expiresIn: 3600,
    cardTypes: 'VISA,MASTERCARD',
  });

  // 5. Return payment URL
  if (result.success) {
    return NextResponse.json({
      success: true,
      paymentUrl: result.data.url,
      paymentCode: result.data.code,
    });
  } else {
    return NextResponse.json({
      success: false,
      error: result.message,
    }, { status: 400 });
  }
}
```

### 5. 🆕 CREATE: `/zyro-app/app/api/checkout/payment-callback/route.ts`
**Purpose**: Handle redirect from PagueloFacil after payment

**Flow**:
```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const tx = searchParams.get('tx'); // Transaction ID
  const orderNumber = searchParams.get('PARM_1');
  const error = searchParams.get('error');

  if (status === 'success' && tx && orderNumber) {
    // PAYMENT SUCCESSFUL
    // 1. Create order in database
    // 2. Create order items
    // 3. Create prescriptions
    // 4. Clear cart
    // 5. Redirect to /orders/[id]/confirmation

    return NextResponse.redirect(`/orders/${orderId}/confirmation`);
  } else {
    // PAYMENT FAILED
    // Redirect to checkout with error
    return NextResponse.redirect(`/checkout?error=${encodeURIComponent(error || 'Pago fallido')}`);
  }
}
```

### 6. 🔄 REFACTOR: `/zyro-app/app/checkout/CheckoutClient.tsx`
**Changes**:

1. **Remove Step 3 (Payment)** - Now only 3 steps: Shipping, Method, Review
2. **Remove CardInputForm import and usage**
3. **Update handlePlaceOrder()**:

```typescript
const handlePlaceOrder = async () => {
  setIsProcessing(true);

  try {
    // 1. Generate order number
    const orderNumber = `ZERO-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 100000)
    ).padStart(5, '0')}`;

    // 2. Calculate total
    const total = totals.total;

    // 3. Create payment link
    const response = await fetch('/api/checkout/create-payment-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: total,
        orderNumber,
        description: `ZERO Optical - Order #${orderNumber}`,
      }),
    });

    const result = await response.json();

    if (result.success && result.paymentUrl) {
      // 4. Save cart data to session/database before redirect
      // (So we can restore it if payment fails)
      await saveCheckoutSession({
        orderNumber,
        addressId: selectedAddressId,
        shippingMethod,
        cartItems,
      });

      // 5. Redirect to PagueloFacil
      window.location.href = result.paymentUrl;
    } else {
      setError(result.error || 'No se pudo crear el enlace de pago');
    }
  } catch (err) {
    setError('Error al procesar el pago');
  } finally {
    setIsProcessing(false);
  }
};
```

### 7. 🆕 CREATE: `/zyro-app/app/api/checkout/session/route.ts`
**Purpose**: Save/restore checkout session for redirect flow

**Why needed**: When user redirects to PagueloFacil, we need to save:
- Order number
- Selected address
- Shipping method
- Cart items (in case callback needs them)

**Implementation**: Use Supabase table `checkout_sessions` or Redis

### 8. 🔄 UPDATE: `.env.local` and `.env.example`
**Remove**: `PAGUELOFACIL_TOKEN` (not used in LinkDeamon)
**Keep**: `PAGUELOFACIL_CCLW`
**Add**: `NEXT_PUBLIC_APP_URL` (for return URL)

```bash
# PagueloFacil Payment Gateway (Panama)
PAGUELOFACIL_CCLW=B3B42F50E474663C6E508CA8DFA9869BC0FBA03E9E6650226DDFBCC38F55C4CF2C190251E1793674A96149D931DC08E5FBB33255D2D83654DF669538BE6B6B9B
PAGUELOFACIL_ENVIRONMENT=sandbox  # or 'production'

# Application URL (for payment callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Production: https://zero.com
```

---

## Database Schema

### New Table: `checkout_sessions`

```sql
CREATE TABLE checkout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  payment_link_code TEXT, -- LK-XXX from PagueloFacil
  address_id UUID REFERENCES addresses(id),
  shipping_method TEXT,
  cart_snapshot JSONB, -- Full cart data
  amount DECIMAL(10, 2),
  status TEXT DEFAULT 'pending', -- pending, completed, failed, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  completed_at TIMESTAMPTZ,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'expired'))
);

CREATE INDEX idx_checkout_sessions_user_id ON checkout_sessions(user_id);
CREATE INDEX idx_checkout_sessions_order_number ON checkout_sessions(order_number);
CREATE INDEX idx_checkout_sessions_payment_link_code ON checkout_sessions(payment_link_code);
```

### Existing `orders` table
Already has required columns - no changes needed:
- `payment_method` - Set to "PagueloFacil"
- `payment_status` - Set to 'completed'
- `payment_transaction_id` - Store tx from callback

---

## Implementation Steps (Refactor)

### Phase 1: Cleanup (30 minutes)
1. ✅ Delete `/zyro-app/components/CardInputForm.tsx`
2. ✅ Delete `/zyro-app/app/api/checkout/process-payment/route.ts`
3. ✅ Update `/zyro-app/lib/types/payment.ts` - Remove card types, add redirect types
4. ✅ Update `.env.local` - Remove TOKEN, add APP_URL

### Phase 2: Core Refactor (2 hours)
5. ✅ Refactor `/zyro-app/lib/payment/paguelofacil-client.ts`
   - Replace `authorizeAndCapture()` with `createPaymentLink()`
   - Update endpoint to `LinkDeamon.cfm`
   - Implement hex encoding for return URL
   - Use form-urlencoded format
6. ✅ Create `/zyro-app/app/api/checkout/create-payment-link/route.ts`
7. ✅ Create database migration for `checkout_sessions` table

### Phase 3: Callback Handler (1.5 hours)
8. ✅ Create `/zyro-app/app/api/checkout/session/route.ts` (save/get session)
9. ✅ Create `/zyro-app/app/api/checkout/payment-callback/route.ts`
   - Handle success case (create order)
   - Handle failure case (restore cart, show error)
   - Verify transaction with PagueloFacil (optional but recommended)

### Phase 4: Frontend Updates (1 hour)
10. ✅ Refactor `/zyro-app/app/checkout/CheckoutClient.tsx`
    - Remove Step 3 (Payment) - now only 3 steps
    - Remove CardInputForm usage
    - Update `handlePlaceOrder()` to create payment link and redirect
    - Add error handling for failed link creation
11. ✅ Update `/zyro-app/app/checkout/page.tsx` if needed

### Phase 5: Testing (1 hour)
12. ✅ Test payment link creation
13. ✅ Test redirect to PagueloFacil
14. ✅ Test successful payment flow
15. ✅ Test failed payment flow
16. ✅ Test expired link handling
17. ✅ Verify order creation with transaction ID

---

## Security Improvements (vs Direct API)

### ✅ Benefits of Redirect Flow
1. **No PCI Compliance Burden**: We never see or handle card data
2. **No Card Data in Logs**: Impossible to accidentally log sensitive data
3. **No Frontend Security Risks**: Card form is on PagueloFacil's domain
4. **Built-in Fraud Detection**: PagueloFacil handles all fraud checks
5. **3D Secure Support**: Automatic for cards that require it
6. **Multiple Payment Methods**: Supports Nequi, Cash, Clave, Crypto

### ⚠️ New Security Considerations
1. **Callback Verification**: Must verify callbacks are from PagueloFacil
2. **Session Management**: Secure checkout session storage
3. **Replay Attacks**: Prevent duplicate order creation from same callback
4. **CSRF Protection**: Validate PARM_1 matches expected order number

---

## Testing Strategy

### Manual Testing Checklist

**Successful Payment**:
- [ ] User completes checkout steps 1-2
- [ ] User clicks "Pagar y Confirmar Pedido"
- [ ] Payment link created successfully
- [ ] User redirected to checkout.paguelofacil.com
- [ ] User enters card (use test card from PagueloFacil docs)
- [ ] Payment succeeds
- [ ] User redirected back to our site
- [ ] Order created in database with transaction ID
- [ ] Cart cleared
- [ ] Confirmation page shows

**Failed Payment**:
- [ ] User reaches PagueloFacil checkout
- [ ] User enters invalid/declined card
- [ ] Payment fails
- [ ] User redirected back to our site
- [ ] Error message displayed
- [ ] Cart still intact
- [ ] User can retry

**Edge Cases**:
- [ ] User closes tab during payment (cart should remain)
- [ ] Payment link expires (1 hour)
- [ ] User clicks back button
- [ ] Duplicate callback (should not create duplicate order)
- [ ] Invalid callback parameters (should reject)

---

## Performance Targets

- **Payment Link Creation**: < 2 seconds
- **Redirect Time**: Instant (client-side)
- **Callback Processing**: < 3 seconds
- **Order Creation**: < 5 seconds total

---

## Success Criteria (Revised)

**MVP Launch Ready When**:
- ✅ Users can pay with VISA/Mastercard (+ other methods)
- ✅ Payment link created successfully
- ✅ Redirect to PagueloFacil works
- ✅ Callback handler creates orders correctly
- ✅ Failed payments handled gracefully
- ✅ Transaction ID stored in database
- ✅ **ZERO card data handled on our site** (major security win!)
- ✅ Cart preserved on failure
- ✅ Test environment working correctly
- ✅ Production environment tested (with small test payment)

---

## Rollback Plan

**If redirect flow has issues**:
1. Revert all changes (git revert)
2. Show "Payment coming soon" placeholder
3. Create orders as 'pending'
4. Process payments manually via PagueloFacil dashboard

**Much easier than direct API rollback** because:
- No sensitive data handling
- Simpler implementation
- Fewer failure points

---

## Migration from Direct API to Redirect

### Files to Delete
- ✅ `/zyro-app/components/CardInputForm.tsx`
- ✅ `/zyro-app/components/ui/select.tsx` (if only used by CardInputForm)
- ✅ `/zyro-app/app/api/checkout/process-payment/route.ts`

### Files to Refactor
- ✅ `/zyro-app/lib/types/payment.ts`
- ✅ `/zyro-app/lib/payment/paguelofacil-client.ts`
- ✅ `/zyro-app/app/checkout/CheckoutClient.tsx`
- ✅ `/zyro-app/app/checkout/page.tsx`

### Files to Create
- ✅ `/zyro-app/app/api/checkout/create-payment-link/route.ts`
- ✅ `/zyro-app/app/api/checkout/payment-callback/route.ts`
- ✅ `/zyro-app/app/api/checkout/session/route.ts`
- ✅ Migration for `checkout_sessions` table

### NPM Packages to Remove
- ✅ `@radix-ui/react-select` (no longer needed)

---

## Timeline (Refactor)

**Total Estimated Time**: 4-6 hours

- Phase 1 (Cleanup): 30 minutes
- Phase 2 (Core Refactor): 2 hours
- Phase 3 (Callback Handler): 1.5 hours
- Phase 4 (Frontend Updates): 1 hour
- Phase 5 (Testing): 1 hour

**Recommended Schedule**:
- Session 1: Phases 1-2 (2.5 hours)
- Session 2: Phases 3-4 (2.5 hours)
- Session 3: Phase 5 + fixes (1 hour)

---

## Lessons Learned

### What Went Wrong
1. ❌ Assumed direct API without checking official docs first
2. ❌ Implemented complex CardInputForm unnecessarily
3. ❌ Added PCI compliance burden to our application
4. ❌ Spent time on wrong implementation (5+ hours wasted)

### What to Do Differently
1. ✅ **Always read official docs first** before implementing
2. ✅ Test API endpoints early (would have caught 404)
3. ✅ Start with simplest integration (redirect is simpler)
4. ✅ Verify with payment provider before building

### Silver Lining
1. ✅ Learned TypeScript payment types (reusable)
2. ✅ Environment setup is correct (CCLW is valid)
3. ✅ Database schema is correct (no changes needed)
4. ✅ **Redirect flow is actually better** (more secure, simpler)

---

## Contact & Support

**PagueloFacil Support**:
- Website: https://www.paguelofacil.com
- Support: https://soporte.paguelofacil.com
- Developers Documentation: (request from support)

**Sandbox Endpoints**:
- LinkDeamon: `https://secure.paguelofacil.com/LinkDeamon.cfm`
- Checkout: `https://checkout.paguelofacil.com`
- API Sandbox: `https://sandbox.paguelofacil.com/`
- API Sandbox Alt: `https://api-sand.pfserver.net/`

---

## DETAILED EXECUTION PLAN

### Phase 0: Update Documentation (5 min)

✅ **Step 0.1**: Add this detailed execution plan to documentation (COMPLETE)

---

### Phase 1: Cleanup (30 min)

**Step 1.1**: Delete obsolete files
```bash
rm components/CardInputForm.tsx
rm app/api/checkout/process-payment/route.ts
rm components/ui/select.tsx
```

**Step 1.2**: Update environment variables

`.env.local`:
- Remove: `PAGUELOFACIL_TOKEN`
- Keep: `PAGUELOFACIL_CCLW`
- Add: `NEXT_PUBLIC_APP_URL=http://localhost:3000`

`.env.example`:
- Update to match

**Step 1.3**: Uninstall unused packages
```bash
npm uninstall @radix-ui/react-select
```

---

### Phase 2: Core Refactor (2 hours)

**Step 2.1**: Refactor payment types (`lib/types/payment.ts`)

Remove:
- `CardDetails`, `CardValidationResult`
- Old `ProcessPaymentRequest/Response`

Add:
- `CreatePaymentLinkRequest/Response`
- `PaymentCallbackParams`
- `CheckoutSession`

**Step 2.2**: Refactor PagueloFacil client (`lib/payment/paguelofacil-client.ts`)

Remove:
- `authorizeAndCapture()` method
- All card-related code

Update:
- Endpoint to `https://secure.paguelofacil.com/LinkDeamon.cfm`
- Remove `token` from config

Add:
- `createPaymentLink()` method with hex encoding and form-urlencoded

**Step 2.3**: Create database migration

File: `supabase/migrations/[timestamp]_checkout_sessions.sql`
- Create `checkout_sessions` table
- Add indexes

**Step 2.4**: Apply migration
```bash
npx supabase db push
```

---

### Phase 3: API Routes (1.5 hours)

**Step 3.1**: Create `app/api/checkout/create-payment-link/route.ts`
- Authenticate user
- Validate request
- Call `client.createPaymentLink()`
- Return payment URL

**Step 3.2**: Create `app/api/checkout/session/route.ts`
- POST: Save checkout session
- GET: Retrieve checkout session

**Step 3.3**: Create `app/api/checkout/payment-callback/route.ts`
- Parse query params (status, tx, PARM_1)
- Get session from database
- Success: Create order, clear cart, redirect to confirmation
- Failure: Show error, redirect to checkout

---

### Phase 4: Frontend Updates (1 hour)

**Step 4.1**: Refactor `app/checkout/CheckoutClient.tsx`
- Remove CardInputForm import/usage
- Remove payment step (3 steps total now)
- Remove cardData state
- Update `handlePlaceOrder()` to:
  1. Generate order number
  2. Save checkout session
  3. Create payment link
  4. Redirect to PagueloFacil

**Step 4.2**: Update `app/checkout/page.tsx` if needed

---

### Phase 5: Testing (1 hour)

**Test Checklist**:
- [ ] Payment link creation works
- [ ] Redirect to checkout.paguelofacil.com
- [ ] Successful payment creates order
- [ ] Failed payment shows error
- [ ] Cart preserved on failure
- [ ] TypeScript compiles (`npx tsc --noEmit`)

---

**Document Status**: 🔄 UPDATED - Ready for refactor
**Next Step**: Execute Phase 1 - Cleanup
**Blocking Issues**: None - correct approach identified

---

**End of Revised Plan Document**
