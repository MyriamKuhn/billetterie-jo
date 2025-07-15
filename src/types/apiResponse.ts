/** Standard shape for methods that return an HTTP status plus an ApiResponse payload */
export type ResendResponse = {
  status: number;
  data: ApiResponse;
};

/** Generic API response wrapper used across auth endpoints */
export interface ApiResponse {
  message: string;
  code?: string;
  token?: string;
  user?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    role: 'user' | 'admin' | 'employee';
    twofa_enabled: boolean;
  };
  twofa_enabled?: boolean;
}

/** Shape of the response when initiating 2FA enablement (returns QR code and secret) */
export interface TwoFAResendResponse {
  status: number;
  data: TwoFAResponse;
}

/** Data returned when enabling two-factor authentication */
export interface TwoFAResponse {
  qrCodeUrl: string;
  secret: string;
  expires_at: string;
}

/** Data returned after confirming two-factor auth setup */
export interface ConfirmTwoFAResponse {
  recovery_codes: string[];
}

/** Data returned when initializing a payment (e.g. via Stripe) */
export interface PaymentInitData {
  uuid: string;
  status: string; 
  transaction_id: string | null;
  client_secret: string;
}

/** Response shape for polling payment status */
export interface PaymentStatusResponse {
  status: string;
  paid_at: string;
}