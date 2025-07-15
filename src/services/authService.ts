import axios from 'axios';
import { API_BASE_URL } from '../config';
import type { ApiResponse } from '../types/apiResponse';
import type { ResendResponse } from '../types/apiResponse';

export interface RegisterPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  password_confirmation: string;
  captcha_token: string;
  accept_terms: boolean;
};

/**
 * Log in a user (including optional 2FA).
 * @param email        User email
 * @param password     User password
 * @param remember     "Remember me" flag
 * @param twofa_code   Two-factor code (empty if not used)
 * @param lang         Language for Accept-Language header
 * @param guestCartId  ID of guest cart, if any
 * @returns            Parsed API response
 */
export async function loginUser(
  email: string,
  password: string,
  remember: boolean,
  twofa_code: string,
  lang: string,
  guestCartId: string | null
): Promise<ApiResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': lang,
  };
  if (guestCartId) headers['X-Guest-Cart-Id'] = guestCartId;

  const payload = { email, password, remember, twofa_code };
  const response = await axios.post<ApiResponse>(
    `${API_BASE_URL}/api/auth/login`,
    payload,
    { headers }
  );
  return response.data;
}

/**
 * Resend the verification email to a given address.
 * @param email  User email
 * @param lang   Language for Accept-Language header
 */
export async function resendVerificationEmail(
  email: string,
  lang: string
): Promise<ResendResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': lang,
  };
  const response = await axios.post<ApiResponse>(
    `${API_BASE_URL}/api/auth/email/resend`,
    { email },
    { headers }
  );
  return {
    status: response.status,
    data: response.data,
  };
};

/**
 * Log out the current user by revoking their token.
 * @param token  JWT to revoke
 */
export async function logoutUser(
  token: string
): Promise<ResendResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
  const response = await axios.post<ApiResponse>(
    `${API_BASE_URL}/api/auth/logout`,
    {},
    { headers }
  );
  return {
    status: response.status,
    data: response.data,
  };
};

/**
 * Register a new user account.
 * @param payload  Registration form data
 * @param lang     Language for Accept-Language header
 */
export async function registerUser(
  payload: RegisterPayload,
  lang: string
): Promise<ResendResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': lang,
  };

  const response = await axios.post<ApiResponse>(
    `${API_BASE_URL}/api/auth/register`,
    payload,
    { headers }
  );

  return {
    status: response.status,
    data: response.data,
  };
}

/**
 * Initiate a password reset (forgot password) flow.
 * @param email  User email
 * @param lang   Language for Accept-Language header
 */
export async function passwordForgottenDemand(
  email: string,
  lang: string
): Promise<ResendResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': lang,
  };
  const response = await axios.post<ApiResponse>(
    `${API_BASE_URL}/api/auth/password/forgot`,
    { email },
    { headers }
  );
  return {
    status: response.status,
    data: response.data,
  };
};

/**
 * Complete the password reset using a token from email.
 * @param token                   Reset token from email link
 * @param email                   User email
 * @param password                New password
 * @param password_confirmation   Confirmation of new password
 * @param lang                    Language for Accept-Language header
 */
export async function resetPassword(
  token: string,
  email: string,
  password: string,
  password_confirmation: string,
  lang: string
): Promise<{ status: number; data: ApiResponse }> {
  const headers: Record<string,string> = {
    'Content-Type': 'application/json',
    'Accept-Language': lang,
  };
  const response = await axios.post<ApiResponse>(
    `${API_BASE_URL}/api/auth/password/reset`,
    { token, email, password, password_confirmation },
    { headers }
  );
  return { status: response.status, data: response.data };
}