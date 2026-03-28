import { CreateCrewRequest, CreateCrewResponse, ApiError } from '@/types/crew'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5165'

export class AuthService {
  static getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('accessToken')
  }
}

export class CrewApiService {
  private static getAuthHeaders(): HeadersInit {
    const token = AuthService.getToken()
    
    const headers: HeadersInit = {
      'accept': '*/*',
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  private static async handleResponse(response: Response): Promise<CreateCrewResponse> {
    if (response.status === 401) {
      throw {
        message: 'Unauthorized. Please login again.',
        statusCode: 401
      }
    }

    if (!response.ok) {
      let errorData: ApiError
      
      try {
        errorData = await response.json()
      } catch {
        errorData = {
          message: `HTTP error! status: ${response.status}`,
          statusCode: response.status
        }
      }
      
      throw errorData
    }

    try {
      return await response.json()
    } catch (error) {
      throw {
        message: 'Failed to parse response from server',
        statusCode: 500
      }
    }
  }

  static async createCrewMember(data: CreateCrewRequest): Promise<CreateCrewResponse> {
    const headers = this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}/api/admin/users/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })

    return this.handleResponse(response)
  }
}

export const getSaccoId = (): string => {
  if (typeof window === 'undefined') return ''
  
  const storedSacco = localStorage.getItem('saccoId')
  if (storedSacco) return storedSacco

  const userData = localStorage.getItem('userData')
  if (userData) {
    try {
      const user = JSON.parse(userData)
      if (user?.saccoId) return user.saccoId
    } catch {
      // Invalid JSON
    }
  }

  console.warn('No saccoId found in storage')
  return '3fa85f64-5717-4562-b3fc-2c963f66afa6'
}

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy text:', err)
    return false
  }
}