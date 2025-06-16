import axios from 'axios';
import { vi, describe, it, beforeEach, expect } from 'vitest';

// Mock du module config pour fixer API_BASE_URL à une valeur connue
vi.mock('../config', () => ({
  API_BASE_URL: 'http://api.example.com',
}));

// Mock de axios
vi.mock('axios');

import {
  fetchUser,
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  enableTwoFA,
  confirmTwoFA,
  disableTwoFA,
} from './userService'; // ajustez le chemin si besoin

describe('userService', () => {
  const token = 'fake-token';
  const baseUrl = 'http://api.example.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchUser', () => {
    it('appelle axios.get avec l’URL et headers corrects et retourne status/data', async () => {
      const mockData = { id: 123, name: 'Alice' };
      // @ts-ignore
      axios.get.mockResolvedValue({ status: 200, data: mockData });

      const result = await fetchUser(token);

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        `${baseUrl}/api/users/me`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      expect(result).toEqual({ status: 200, data: mockData });
    });

    it('propage l’erreur si axios.get rejette', async () => {
      const error = new Error('Network error');
      // @ts-ignore
      axios.get.mockRejectedValue(error);

      await expect(fetchUser(token)).rejects.toBe(error);
      expect(axios.get).toHaveBeenCalled();
    });
  });

  describe('updateUserProfile', () => {
    it('appelle axios.patch avec l’URL, payload et headers corrects et retourne status/data', async () => {
      const profileData = { firstname: 'Alice', lastname: 'Smith' };
      const mockData = { success: true };
      // @ts-ignore
      axios.patch.mockResolvedValue({ status: 204, data: mockData });

      const result = await updateUserProfile(token, profileData);

      expect(axios.patch).toHaveBeenCalledTimes(1);
      expect(axios.patch).toHaveBeenCalledWith(
        `${baseUrl}/api/users/me`,
        profileData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      expect(result).toEqual({ status: 204, data: mockData });
    });

    it('propage l’erreur si axios.patch rejette', async () => {
      const error = { message: 'Failed' };
      // @ts-ignore
      axios.patch.mockRejectedValue(error);
      await expect(updateUserProfile(token, { firstname: 'A', lastname: 'B' })).rejects.toBe(error);
    });
  });

  describe('updateUserEmail', () => {
    it('appelle axios.patch avec l’URL, payload et headers (incl. Accept-Language) corrects et retourne status/data', async () => {
      const email = 'alice@example.com';
      const lang = 'fr';
      const mockData = { updated: true };
      // @ts-ignore
      axios.patch.mockResolvedValue({ status: 202, data: mockData });

      const result = await updateUserEmail(token, email, lang);

      expect(axios.patch).toHaveBeenCalledTimes(1);
      expect(axios.patch).toHaveBeenCalledWith(
        `${baseUrl}/api/auth/email`,
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept-Language': lang,
          },
        }
      );
      expect(result).toEqual({ status: 202, data: mockData });
    });

    it('propage l’erreur si axios.patch rejette', async () => {
      const error = new Error('Email error');
      // @ts-ignore
      axios.patch.mockRejectedValue(error);
      await expect(updateUserEmail(token, 'a@b.com', 'en')).rejects.toBe(error);
    });
  });

  describe('updateUserPassword', () => {
    it('appelle axios.patch avec URL, payload et headers corrects et retourne status/data', async () => {
      const current_password = 'oldPass';
      const password = 'newPass';
      const password_confirmation = 'newPass';
      const mockData = { changed: true };
      // @ts-ignore
      axios.patch.mockResolvedValue({ status: 200, data: mockData });

      const result = await updateUserPassword(token, current_password, password, password_confirmation);

      expect(axios.patch).toHaveBeenCalledTimes(1);
      expect(axios.patch).toHaveBeenCalledWith(
        `${baseUrl}/api/auth/password`,
        { current_password, password, password_confirmation },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      expect(result).toEqual({ status: 200, data: mockData });
    });

    it('propage l’erreur si axios.patch rejette', async () => {
      const error = { code: 'ERR' };
      // @ts-ignore
      axios.patch.mockRejectedValue(error);
      await expect(updateUserPassword(token, 'o', 'n', 'n')).rejects.toBe(error);
    });
  });

  describe('enableTwoFA', () => {
    it('appelle axios.post avec URL, payload vide et headers corrects et retourne status/data', async () => {
      const mockData = { qrCode: '...' };
      // @ts-ignore
      axios.post.mockResolvedValue({ status: 201, data: mockData });

      const result = await enableTwoFA(token);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        `${baseUrl}/api/auth/2fa/enable`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      expect(result).toEqual({ status: 201, data: mockData });
    });

    it('propage l’erreur si axios.post rejette', async () => {
      const error = new Error('2FA enable error');
      // @ts-ignore
      axios.post.mockRejectedValue(error);
      await expect(enableTwoFA(token)).rejects.toBe(error);
    });
  });

  describe('confirmTwoFA', () => {
    it('appelle axios.post avec URL, payload otp et headers corrects et retourne status/data', async () => {
      const otp = '123456';
      const mockData = { confirmed: true };
      // @ts-ignore
      axios.post.mockResolvedValue({ status: 200, data: mockData });

      const result = await confirmTwoFA(token, otp);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        `${baseUrl}/api/auth/2fa/confirm`,
        { otp },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      expect(result).toEqual({ status: 200, data: mockData });
    });

    it('propage l’erreur si axios.post rejette', async () => {
      const otp = '000000';
      const error = new Error('2FA confirm error');
      // @ts-ignore
      axios.post.mockRejectedValue(error);
      await expect(confirmTwoFA(token, otp)).rejects.toBe(error);
      // On peut aussi vérifier l’appel même en cas d’erreur :
      expect(axios.post).toHaveBeenCalledWith(
        `${baseUrl}/api/auth/2fa/confirm`,
        { otp },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
    });
  });

  describe('disableTwoFA', () => {
    it('appelle axios.post avec URL, payload twofa_code et headers corrects et retourne {status}', async () => {
      const twofa_code = '123456';
      // @ts-ignore
      axios.post.mockResolvedValue({ status: 204, data: { /* ignoré */ } });

      const result = await disableTwoFA(token, twofa_code);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        `${baseUrl}/api/auth/2fa/disable`,
        { twofa_code },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      expect(result).toEqual({ status: 204 });
    });

    it('propage l’erreur si axios.post rejette', async () => {
      const error = { message: 'Disable 2FA failed' };
      // @ts-ignore
      axios.post.mockRejectedValue(error);
      await expect(disableTwoFA(token, '000000')).rejects.toBe(error);
    });
  });
});
