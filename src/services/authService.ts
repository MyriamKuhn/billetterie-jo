import axios from 'axios';
import { API_BASE_URL } from '../config';
import type { ApiResponse } from '../pages/LoginPage';

export type ResendResponse = {
  status: number;
  data: ApiResponse;
};

export interface RegisterPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  password_confirmation: string;
  captcha_token: string;
  accept_terms: boolean;
};

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
 * Révoque le token côté serveur.
 *
 * @param token     Token JWT à révoquer
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
 * Enregistre un nouvel utilisateur.
 *
 * @param payload   Données du formulaire d'inscription
 * @param lang      Code de langue pour l'en-tête Accept-Language
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