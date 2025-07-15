import axios from 'axios';
import { API_BASE_URL } from '../config';
import type { ApiResponse, ResendResponse, TwoFAResponse, TwoFAResendResponse, ConfirmTwoFAResponse } from '../types/apiResponse';

/**
 * Fetches the current user's profile.
 *
 * @param token   Bearer token for authentication.
 * @param config  Optional Axios config (supports AbortSignal for cancellation).
 * @returns       An object containing HTTP status and the API response data.
 * @throws        On network failure or non‑2xx HTTP status.
 */
export async function fetchUser(
  token: string,
  config?: { signal?: AbortSignal }
): Promise<ResendResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const response = await axios.get<ApiResponse>(
    `${API_BASE_URL}/api/users/me`,
    {
      headers,
      signal: config?.signal,
    }
  );

  return {
    status: response.status,
    data: response.data,
  };
}

/**
 * Updates the current user's firstname and lastname.
 *
 * @param token         Bearer token for authentication.
 * @param profileData   Object with `firstname` and `lastname`.
 * @returns             An object containing HTTP status and the API response.
 * @throws              On network failure or non‑2xx HTTP status.
 */
export async function updateUserProfile(
  token: string,
  profileData: {
    firstname: string;
    lastname: string;
  },
): Promise<ResendResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const response = await axios.patch<ApiResponse>(
    `${API_BASE_URL}/api/users/me`,
    profileData,
    { headers },
  );

  return {
    status: response.status,
    data: response.data,
  };
}

/**
 * Updates the current user's email address.
 *
 * @param token  Bearer token for authentication.
 * @param email  New email address.
 * @param lang   Language code for the Accept-Language header.
 * @returns      An object containing HTTP status and the API response.
 */
export async function updateUserEmail(
  token: string,
  email: string,
  lang: string
): Promise<ResendResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Accept-Language': lang
  };

  const response = await axios.patch<ApiResponse>(
    `${API_BASE_URL}/api/auth/email`,
    { email },
    { headers },
  );

  return {
    status: response.status,
    data: response.data,
  };
}

/**
 * Changes the current user's password.
 *
 * @param token                  Bearer token for authentication.
 * @param current_password       User's current password.
 * @param password               New password.
 * @param password_confirmation  Confirmation of the new password.
 * @returns                      An object containing HTTP status and the API response.
 */
export async function updateUserPassword(
  token: string,
  current_password: string,
  password: string,
  password_confirmation: string
): Promise<ResendResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const response = await axios.patch<ApiResponse>(
    `${API_BASE_URL}/api/auth/password`,
    { current_password, password, password_confirmation },
    { headers },
  );

  return {
    status: response.status,
    data: response.data,
  };
}

/**
 * Initiates enabling two‑factor authentication (2FA).
 *
 * @param token  Bearer token for authentication.
 * @returns      An object containing HTTP status and the response data with QR code URL & secret.
 */
export async function enableTwoFA(
  token: string
): Promise<TwoFAResendResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const response = await axios.post<TwoFAResponse>(
    `${API_BASE_URL}/api/auth/2fa/enable`,
    {},
    { headers },
  );

  return {
    status: response.status,
    data: response.data,
  };
}

/**
 * Confirms two‑factor authentication by verifying the OTP.
 *
 * @param token  Bearer token for authentication.
 * @param otp    One‑time password from the authenticator app.
 * @returns      An object containing HTTP status and optionally the recovery codes.
 */
export async function confirmTwoFA(
  token: string,
  otp: string
): Promise<{ status: number; data?: ConfirmTwoFAResponse }> {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const response = await axios.post<ConfirmTwoFAResponse>(
    `${API_BASE_URL}/api/auth/2fa/confirm`,
    { otp },
    { headers },
  );

  return {
    status: response.status,
    data: response.data,
  };
}

/**
 * Disables two‑factor authentication.
 *
 * @param token      Bearer token for authentication.
 * @param twofa_code OTP or recovery code to authorize the disable.
 * @returns          An object containing the HTTP status.
 */
export async function disableTwoFA(
  token: string, 
  twofa_code: string,
): Promise<{status: number}> {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const response = await axios.post(
    `${API_BASE_URL}/api/auth/2fa/disable`,
    { twofa_code },
    { headers },
  );
  
  return { status: response.status };
}