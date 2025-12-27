/**
 * Payment System Type Definitions - REDIRECT FLOW
 *
 * This file contains all TypeScript interfaces for the PagueloFacil payment integration.
 * These types ensure type safety across the redirect-based payment flow.
 *
 * SECURITY NOTE: User enters card details on PagueloFacil's hosted checkout page.
 * We never see or handle card data - PagueloFacil handles all PCI compliance.
 */

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Configuration for PagueloFacil API client
 */
export interface PagueloFacilConfig {
  cclw: string;                              // Merchant ID (from PagueloFacil dashboard)
  environment: 'sandbox' | 'production';     // API environment
  timeout?: number;                          // Request timeout in milliseconds (default: 30000)
}

// ============================================================================
// LINKDEAMON API TYPES (Payment Link Creation)
// ============================================================================

/**
 * Request to create a payment link via LinkDeamon
 */
export interface CreatePaymentLinkRequest {
  amount: number;                            // Total amount to charge (e.g., 149.99)
  description: string;                       // Description (e.g., "ZERO Optical - Order #...")
  returnUrl: string;                         // URL to redirect after payment (plain text, not hex)
  orderNumber: string;                       // Our order number (sent as PARM_1)
  expiresIn?: number;                        // Link expiration in seconds (default: 3600 = 1 hour)
  // NOTE: taxAmount and cardTypes removed to match the-leap working implementation
}

/**
 * Response from LinkDeamon API when creating payment link
 */
export interface CreatePaymentLinkResponse {
  success: boolean;
  data?: {
    url: string;                             // Payment URL to redirect user to
    code: string;                            // Payment link code (LK-XXXXX)
  };
  headerStatus: {
    code: number;                            // HTTP status code
    description: string;                     // Status description
  };
  serverTime: string;                        // Server timestamp
  message: string;                           // Response message
}

// ============================================================================
// PAYMENT CALLBACK TYPES (After Payment Completes)
// ============================================================================

/**
 * Query parameters from PagueloFacil callback/redirect
 */
export interface PaymentCallbackParams {
  status: 'success' | 'failed';              // Payment outcome
  code: string;                              // Payment link code (LK-XXXXX)
  tx?: string;                               // Transaction ID (only on success)
  PARM_1: string;                            // Our order number (echoed back)
  error?: string;                            // Error message (only on failure)
}

// ============================================================================
// CHECKOUT SESSION TYPES
// ============================================================================

/**
 * Checkout session data (stored before redirect)
 */
export interface CheckoutSession {
  id?: string;                               // Database ID
  userId: string;                            // User ID
  orderNumber: string;                       // Pre-generated order number
  paymentLinkCode?: string;                  // LK-XXX from PagueloFacil
  addressId: string;                         // Selected shipping address
  shippingMethod: string;                    // "standard" or "express"
  cartSnapshot: any[];                       // Full cart data (in case we need to restore)
  amount: number;                            // Total amount
  status?: 'pending' | 'completed' | 'failed' | 'expired';
  createdAt?: string;
  expiresAt?: string;
  completedAt?: string;
}

// ============================================================================
// API ROUTE TYPES (Our Backend)
// ============================================================================

/**
 * Request to create payment link endpoint
 * POST /api/checkout/create-payment-link
 */
export interface CreatePaymentRequest {
  amount: number;                            // Total amount
  orderNumber: string;                       // Pre-generated order number
  description: string;                       // Order description
}

/**
 * Response from create payment link endpoint
 */
export interface CreatePaymentResponse {
  success: boolean;
  paymentUrl?: string;                       // URL to redirect user to
  paymentCode?: string;                      // Payment link code
  error?: string;                            // Error message if failed
}

/**
 * Request to save checkout session
 * POST /api/checkout/session
 */
export interface SaveSessionRequest {
  orderNumber: string;
  addressId: string;
  shippingMethod: string;
  cartItems: any[];
  amount: number;
}

/**
 * Response from session endpoint
 */
export interface SessionResponse {
  success: boolean;
  session?: CheckoutSession;
  error?: string;
}

// ============================================================================
// PAYMENT ERROR TYPES
// ============================================================================

/**
 * Payment error classification
 */
export enum PaymentErrorType {
  VALIDATION_ERROR = 'validation_error',       // Invalid request data
  NETWORK_ERROR = 'network_error',            // Network/timeout issue
  GATEWAY_ERROR = 'gateway_error',            // PagueloFacil API error
  PAYMENT_FAILED = 'payment_failed',          // Payment declined/failed
  AUTHENTICATION_ERROR = 'authentication_error', // User not authenticated
  SESSION_EXPIRED = 'session_expired',        // Checkout session expired
  UNKNOWN_ERROR = 'unknown_error'             // Unknown error
}

/**
 * Detailed payment error
 */
export interface PaymentError {
  type: PaymentErrorType;
  message: string;                            // User-friendly message in Spanish
  details?: string;                           // Technical details (for logging)
  retryable: boolean;                         // Can the user retry?
  code?: string;                              // Error code from gateway
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Payment status for orders
 */
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

/**
 * Payment method
 */
export type PaymentMethod = 'PagueloFacil' | 'Cash' | 'BankTransfer';

/**
 * Order payment information
 */
export interface OrderPaymentInfo {
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_transaction_id?: string;           // tx from PagueloFacil callback
  payment_error?: string;
  paid_at?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if payment link creation was successful
 */
export function isPaymentLinkSuccessful(response: CreatePaymentLinkResponse): boolean {
  return (
    response.success === true &&
    !!response.data?.url &&
    !!response.data?.code
  );
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(errorType: PaymentErrorType): boolean {
  return [
    PaymentErrorType.NETWORK_ERROR,
    PaymentErrorType.PAYMENT_FAILED,
    PaymentErrorType.VALIDATION_ERROR,
  ].includes(errorType);
}

/**
 * Get user-friendly error message in Spanish
 */
export function getErrorMessage(errorType: PaymentErrorType): string {
  const messages: Record<PaymentErrorType, string> = {
    [PaymentErrorType.VALIDATION_ERROR]: 'Error en los datos de pago',
    [PaymentErrorType.NETWORK_ERROR]: 'Error de conexión. Por favor intente nuevamente',
    [PaymentErrorType.GATEWAY_ERROR]: 'Error del procesador de pagos. Contacte soporte',
    [PaymentErrorType.PAYMENT_FAILED]: 'El pago no pudo ser procesado',
    [PaymentErrorType.AUTHENTICATION_ERROR]: 'Debe iniciar sesión para continuar',
    [PaymentErrorType.SESSION_EXPIRED]: 'La sesión expiró. Por favor intente nuevamente',
    [PaymentErrorType.UNKNOWN_ERROR]: 'Error al procesar el pago. Intente nuevamente',
  };

  return messages[errorType];
}
