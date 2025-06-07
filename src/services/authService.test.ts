import axios from 'axios'
import { loginUser, resendVerificationEmail, logoutUser } from './authService'
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
    // Arrange
    mockedPost.mockResolvedValueOnce({
      data: fakeResponseData,
    } as any)

    // Act
    const result = await loginUser(email, password, remember, twofa, lang, null)

    // Assert
    expect(mockedPost).toHaveBeenCalledWith(
      loginUrl,
      { email, password, remember, twofa_code: twofa },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': lang,
        },
      }
    )
    expect(result).toEqual(fakeResponseData)
  })

  it('loginUser → inclut X-Guest-Cart-Id quand guestCartId présent', async () => {
    // Arrange
    mockedPost.mockResolvedValueOnce({
      data: fakeResponseData,
    } as any)

    // Act
    await loginUser(email, password, remember, twofa, lang, guestCartId)

    // Assert
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
    // Arrange
    const fakeRes = { status: 202, data: fakeResponseData }
    mockedPost.mockResolvedValueOnce(fakeRes as any)

    // Act
    const result: ResendResponse = await resendVerificationEmail(email, lang)

    // Assert
    expect(mockedPost).toHaveBeenCalledWith(
      resendUrl,
      { email },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': lang,
        },
      }
    )
    expect(result).toEqual({ status: fakeRes.status, data: fakeRes.data })
  })

  it('logoutUser → envoie les bons headers et retourne status & data', async () => {
    // Arrange
    const fakeRes = { status: 204, data: fakeResponseData }
    mockedPost.mockResolvedValueOnce(fakeRes as any)

    const token = 'my-jwt-token'

    // Act
    const result: ResendResponse = await logoutUser(token)

    // Assert
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
    expect(result).toEqual({
      status: fakeRes.status,
      data: fakeRes.data,
    })
  })

  it('logoutUser → rejette si axios.post échoue', async () => {
    // Arrange
    const token = 'invalid-token'
    const error = new Error('Network error')
    mockedPost.mockRejectedValueOnce(error)

    // Act & Assert
    await expect(logoutUser(token)).rejects.toThrow('Network error')
  })
})
