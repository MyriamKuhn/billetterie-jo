export type ResendResponse = {
  status: number;
  data: ApiResponse;
};

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

export interface TwoFAResendResponse {
  status: number;
  data: TwoFAResponse;
}

export interface TwoFAResponse {
  qrCodeUrl: string;
  secret: string;
  expires_at: string;
}

export interface ConfirmTwoFAResponse {
  recovery_codes: string[];
}
