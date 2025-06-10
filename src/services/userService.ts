import axios from 'axios';
import { API_BASE_URL } from '../config';
import type { ApiResponse, ResendResponse } from '../types/apiResponse';

export async function fetchUser(
  token: string,
): Promise<ResendResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const response = await axios.get<ApiResponse>(
    `${API_BASE_URL}/api/users/me`,
    { headers },
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