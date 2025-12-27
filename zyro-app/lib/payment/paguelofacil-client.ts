/**
 * PagueloFacil API Client - REDIRECT FLOW
 *
 * Handles communication with PagueloFacil LinkDeamon API (Panama).
 * Creates payment links for redirect-based checkout flow.
 *
 * SECURITY:
 * - All requests are server-side only
 * - User enters card data on PagueloFacil's hosted page (not ours)
 * - We never see or handle card data - PagueloFacil handles PCI compliance
 * - Timeout protection (30s default)
 */

import {
  type PagueloFacilConfig,
  type CreatePaymentLinkRequest,
  type CreatePaymentLinkResponse,
  type PaymentError,
  PaymentErrorType,
} from '@/lib/types/payment';

/**
 * PagueloFacil API Client
 */
export class PagueloFacilClient {
  private config: Required<PagueloFacilConfig>;
  private linkDaemonUrl: string;

  constructor(config: PagueloFacilConfig) {
    this.config = {
      cclw: config.cclw,
      environment: config.environment,
      timeout: config.timeout || 30000, // Default 30 seconds
    };

    // Set endpoint based on environment
    this.linkDaemonUrl = this.config.environment === 'production'
      ? 'https://secure.paguelofacil.com/LinkDeamon.cfm'
      : 'https://sandbox.paguelofacil.com/LinkDeamon.cfm';

    // Log environment mode
    if (this.config.environment === 'production') {
      console.warn('[PagueloFacil] Running in PRODUCTION mode - real charges will be made!');
    } else {
      console.log('[PagueloFacil] Running in SANDBOX mode - test charges only');
    }

    console.log(`[PagueloFacil] Using endpoint: ${this.linkDaemonUrl}`);
  }

  /**
   * Create a payment link for redirect-based checkout
   *
   * This method creates a single-use payment link via LinkDeamon API.
   * User will be redirected to PagueloFacil's hosted checkout page.
   *
   * @param request - Payment link request with amount, description, return URL, etc.
   * @returns Promise with payment link response
   * @throws PaymentError if link creation fails
   */
  async createPaymentLink(
    request: CreatePaymentLinkRequest
  ): Promise<CreatePaymentLinkResponse> {
    try {
      // Build form data (application/x-www-form-urlencoded format)
      // NOTE: Matching the-leap working implementation - plain text URL, no CTAX, no CARD_TYPE
      const formData = new URLSearchParams({
        CCLW: this.config.cclw,
        CMTN: request.amount.toFixed(2),
        CDSC: request.description,
        RETURN_URL: request.returnUrl, // Plain text, not hex-encoded
        PARM_1: request.orderNumber,
        EXPIRES_IN: String(request.expiresIn || 3600), // Default 1 hour
      });

      console.log('[PagueloFacil] Creating payment link for order:', request.orderNumber);
      console.log('[PagueloFacil] Request parameters:', {
        CCLW: this.config.cclw.substring(0, 20) + '...',
        CMTN: request.amount.toFixed(2),
        CDSC: request.description,
        RETURN_URL: request.returnUrl,
        PARM_1: request.orderNumber,
        EXPIRES_IN: request.expiresIn || 3600,
      });

      // Setup timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        // Make API request
        const response = await fetch(this.linkDaemonUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': '*/*',
          },
          body: formData.toString(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse JSON response
        const data: CreatePaymentLinkResponse = await response.json();

        // Check if HTTP request was successful
        if (!response.ok) {
          console.error('[PagueloFacil] HTTP error:', response.status, data);
          throw this.createPaymentError(
            PaymentErrorType.GATEWAY_ERROR,
            `HTTP ${response.status}: ${data.headerStatus?.description || 'Unknown error'}`,
            String(data.headerStatus?.code)
          );
        }

        // Check if payment link was created successfully
        if (data.success && data.data?.url) {
          console.log('[PagueloFacil] Payment link created successfully:', {
            code: data.data.code,
            url: data.data.url.substring(0, 50) + '...',
          });
        } else {
          console.warn('[PagueloFacil] Payment link creation failed:', {
            message: data.message,
            status: data.headerStatus?.description,
          });
        }

        return data;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        // Handle timeout
        if (fetchError.name === 'AbortError') {
          throw this.createPaymentError(
            PaymentErrorType.NETWORK_ERROR,
            `Request timeout after ${this.config.timeout}ms`
          );
        }

        // Handle network errors
        throw this.createPaymentError(
          PaymentErrorType.NETWORK_ERROR,
          `Network error: ${fetchError.message}`
        );
      }
    } catch (error) {
      // If it's already a PaymentError, rethrow
      if (this.isPaymentError(error)) {
        throw error;
      }

      // Otherwise, wrap in unknown error
      console.error('[PagueloFacil] Unexpected error:', error);
      throw this.createPaymentError(
        PaymentErrorType.UNKNOWN_ERROR,
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  /**
   * Test connection to PagueloFacil LinkDeamon API
   *
   * This method verifies that credentials are valid and the API is reachable.
   * Use this during setup or health checks.
   *
   * @returns Promise<boolean> - true if connection successful
   */
  async testConnection(): Promise<boolean> {
    try {
      // Make a minimal test request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for test

      const returnUrlHex = Buffer.from('http://localhost:3000/test')
        .toString('hex')
        .toUpperCase();

      const formData = new URLSearchParams({
        CCLW: this.config.cclw,
        CMTN: '0.01',
        CDSC: 'Connection Test',
        CTAX: '0.00',
        RETURN_URL: returnUrlHex,
        PARM_1: 'TEST',
        EXPIRES_IN: '60',
      });

      const response = await fetch(this.linkDaemonUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': '*/*',
        },
        body: formData.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // We expect success or a valid error response
      // If we get 401/403, credentials are wrong
      if (response.status === 401 || response.status === 403) {
        console.error('[PagueloFacil] Authentication failed');
        return false;
      }

      // Any other response means API is reachable
      console.log('[PagueloFacil] Connection test successful');
      return true;
    } catch (error) {
      console.error('[PagueloFacil] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Create a typed PaymentError
   */
  private createPaymentError(
    type: PaymentErrorType,
    details: string,
    code?: string
  ): PaymentError {
    return {
      type,
      message: this.getErrorMessage(type),
      details,
      retryable: this.isRetryable(type),
      code,
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(type: PaymentErrorType): boolean {
    return [
      PaymentErrorType.NETWORK_ERROR,
      PaymentErrorType.PAYMENT_FAILED,
      PaymentErrorType.VALIDATION_ERROR,
    ].includes(type);
  }

  /**
   * Get user-friendly error message in Spanish
   */
  private getErrorMessage(type: PaymentErrorType): string {
    const messages: Record<PaymentErrorType, string> = {
      [PaymentErrorType.VALIDATION_ERROR]: 'Error en los datos de pago',
      [PaymentErrorType.NETWORK_ERROR]: 'Error de conexión. Por favor intente nuevamente',
      [PaymentErrorType.GATEWAY_ERROR]: 'Error del procesador de pagos. Contacte soporte',
      [PaymentErrorType.PAYMENT_FAILED]: 'El pago no pudo ser procesado',
      [PaymentErrorType.AUTHENTICATION_ERROR]: 'Debe iniciar sesión para continuar',
      [PaymentErrorType.SESSION_EXPIRED]: 'La sesión expiró. Por favor intente nuevamente',
      [PaymentErrorType.UNKNOWN_ERROR]: 'Error al procesar el pago. Intente nuevamente',
    };

    return messages[type] || messages[PaymentErrorType.UNKNOWN_ERROR];
  }

  /**
   * Type guard for PaymentError
   */
  private isPaymentError(error: any): error is PaymentError {
    return (
      error &&
      typeof error === 'object' &&
      'type' in error &&
      'message' in error &&
      'retryable' in error
    );
  }
}

/**
 * Factory function to create PagueloFacil client from environment variables
 *
 * This is the recommended way to instantiate the client in server-side code.
 * Reads credentials from process.env automatically.
 *
 * @returns PagueloFacilClient instance
 * @throws Error if environment variables are not set
 */
export function createPagueloFacilClient(): PagueloFacilClient {
  const cclw = process.env.PAGUELOFACIL_CCLW;
  const environment = process.env.PAGUELOFACIL_ENVIRONMENT as
    | 'sandbox'
    | 'production'
    | undefined;

  // Validate required environment variables
  if (!cclw) {
    throw new Error(
      'PAGUELOFACIL_CCLW environment variable is not set. ' +
        'Please add it to your .env.local file.'
    );
  }

  // Default to sandbox if not specified
  const env = environment || 'sandbox';

  return new PagueloFacilClient({
    cclw,
    environment: env,
    timeout: 30000, // 30 seconds
  });
}
