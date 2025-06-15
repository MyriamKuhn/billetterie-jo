import axios from 'axios';
import { API_BASE_URL } from '../config';
import type { ApiResponse, ResendResponse, TwoFAResponse, TwoFAResendResponse } from '../types/apiResponse';

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