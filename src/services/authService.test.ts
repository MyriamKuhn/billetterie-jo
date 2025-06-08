import axios from 'axios'
import {
  loginUser,
  resendVerificationEmail,
  logoutUser,
  registerUser,
  passwordForgottenDemand,
  resetPassword
} from './authService'
import { API_BASE_URL } from '../config'
import type { ResendResponse } from './authService'
import type { ApiResponse } from '../pages/LoginPage'
import { describe, it, expect, vi } from 'vitest'

vi.mock('axios')
const mockedPost = axios.post as unknown as jest.MockedFunction<typeof axios.post>

describe('authService', () => {
  const email = 'user@example.com'
  const password = 'secret'
  const remember = true
  const twofa = '654321'
  const lang = 'fr'
  const guestCartId = 'cart-xyz'
  const loginUrl = `${API_BASE_URL}/api/auth/login`
  const resendUrl = `${API_BASE_URL}/api/auth/email/resend`
  const logoutUrl = `${API_BASE_URL}/api/auth/logout`

  const fakeResponseData: ApiResponse = {
    message: 'OK',
    token: 'tok',
    user: { id: 1, firstname: 'A', lastname: 'B', email, role: 'user', twofa_enabled: false },
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('loginUser → envoie les bons headers sans X-Guest-Cart-Id et retourne data', async () => {
    mockedPost.mockResolvedValueOnce({ data: fakeResponseData } as any)

    const result = await loginUser(email, password, remember, twofa, lang, null)

    expect(mockedPost).toHaveBeenCalledWith(
      loginUrl,
      { email, password, remember, twofa_code: twofa },
      { headers: { 'Content-Type': 'application/json', 'Accept-Language': lang } }
    )
    expect(result).toEqual(fakeResponseData)
  })

  it('loginUser → inclut X-Guest-Cart-Id quand guestCartId présent', async () => {
    mockedPost.mockResolvedValueOnce({ data: fakeResponseData } as any)

    await loginUser(email, password, remember, twofa, lang, guestCartId)

    expect(mockedPost).toHaveBeenCalledWith(
      loginUrl,
      { email, password, remember, twofa_code: twofa },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': lang,
          'X-Guest-Cart-Id': guestCartId,
        },
      }
    )
  })

  it('resendVerificationEmail → renvoie status et data correctement', async () => {
    const fakeRes = { status: 202, data: fakeResponseData }
    mockedPost.mockResolvedValueOnce(fakeRes as any)

    const result: ResendResponse = await resendVerificationEmail(email, lang)

    expect(mockedPost).toHaveBeenCalledWith(
      resendUrl,
      { email },
      { headers: { 'Content-Type': 'application/json', 'Accept-Language': lang } }
    )
    expect(result).toEqual({ status: fakeRes.status, data: fakeRes.data })
  })

  it('logoutUser → envoie les bons headers et retourne status & data', async () => {
    const fakeRes = { status: 204, data: fakeResponseData }
    mockedPost.mockResolvedValueOnce(fakeRes as any)

    const token = 'my-jwt-token'
    const result: ResendResponse = await logoutUser(token)

    expect(mockedPost).toHaveBeenCalledWith(
      logoutUrl,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    expect(result).toEqual({ status: fakeRes.status, data: fakeRes.data })
  })

  it('logoutUser → rejette si axios.post échoue', async () => {
    const token = 'invalid-token'
    const error = new Error('Network error')
    mockedPost.mockRejectedValueOnce(error)

    await expect(logoutUser(token)).rejects.toThrow('Network error')
  })
})

// ------- registerUser tests -------
describe('registerUser', () => {
  const payload = {
    firstname: 'Alice',
    lastname: 'Liddell',
    email: 'alice@example.com',
    password: 'rabbitHole',
    password_confirmation: 'rabbitHole',
    captcha_token: 'tok123',
    accept_terms: true,
  }
  const lang = 'en'
  const registerUrl = `${API_BASE_URL}/api/auth/register`
  const fakeRes = { status: 201, data: { message: 'Created' } as ApiResponse }

  it('→ envoie le bon payload et renvoie status + data', async () => {
    mockedPost.mockResolvedValueOnce(fakeRes as any)

    const result = await registerUser(payload, lang)

    expect(mockedPost).toHaveBeenCalledWith(
      registerUrl,
      payload,
      { headers: { 'Content-Type': 'application/json', 'Accept-Language': lang } }
    )
    expect(result).toEqual({ status: fakeRes.status, data: fakeRes.data })
  })

  it('→ rejette si axios.post échoue', async () => {
    const error = new Error('Network down')
    mockedPost.mockRejectedValueOnce(error)

    await expect(registerUser(payload, lang)).rejects.toThrow('Network down')
  })
})

// ------- passwordForgottenDemand tests -------
describe('passwordForgottenDemand', () => {
  const email = 'forgot@example.com'
  const lang = 'de'
  const fakeRes = { status: 200, data: { message: 'Email sent' } as ApiResponse }

  it('→ envoie le bon payload et renvoie status + data', async () => {
    mockedPost.mockResolvedValueOnce(fakeRes as any)

    const result = await passwordForgottenDemand(email, lang)

    expect(mockedPost).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/auth/password/forgot`,
      { email },
      { headers: { 'Content-Type': 'application/json', 'Accept-Language': lang } }
    )
    expect(result).toEqual({ status: fakeRes.status, data: fakeRes.data })
  })

  it('→ rejette si axios.post échoue', async () => {
    const error = new Error('Timeout')
    mockedPost.mockRejectedValueOnce(error)

    await expect(passwordForgottenDemand(email, lang)).rejects.toThrow('Timeout')
  })
})

// ------- resetPassword tests -------
describe('resetPassword', () => {
  const token = 'tok123'
  const email = 'reset@example.com'
  const password = 'NewPass!2025'
  const password_confirmation = 'NewPass!2025'
  const lang = 'es'
  const fakeRes = { status: 204, data: { message: 'Reset OK' } as ApiResponse }

  it('→ envoie le bon payload et renvoie status + data', async () => {
    mockedPost.mockResolvedValueOnce(fakeRes as any)

    const result = await resetPassword(token, email, password, password_confirmation, lang)

    expect(mockedPost).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/auth/password/reset`,
      { token, email, password, password_confirmation },
      { headers: { 'Content-Type': 'application/json', 'Accept-Language': lang } }
    )
    expect(result).toEqual({ status: fakeRes.status, data: fakeRes.data })
  })

  it('→ rejette si axios.post échoue', async () => {
    const error = new Error('Server down')
    mockedPost.mockRejectedValueOnce(error)

    await expect(
      resetPassword(token, email, password, password_confirmation, lang)
    ).rejects.toThrow('Server down')
  })
})

