/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CreateCrewRequest {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  role: string
  saccoId: string
  sendCredentials: boolean
}

export interface CrewMember {
  id?: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  role: string
  saccoId: string
  createdAt?: string
  updatedAt?: string
}

// V1: Wrapped response with success flag
export interface CreateCrewResponseV1 {
  success: boolean
  message: string
  data: {
    user: CrewMember
    credentials?: {
      employeeId: string
      email: string
      temporaryPassword: string
      userId: string
    }
  }
}

// V2: Direct user object
export interface CreateCrewResponseV2 {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  role: string
  saccoId: string
  employeeId: string
  temporaryPassword?: string
  createdAt: string
  // Optional fields for different APIs
  message?: string
  userId?: string
  password?: string
}

// Generic API response that could be either structure
export type CreateCrewResponse = CreateCrewResponseV1 | CreateCrewResponseV2

export interface Credentials {
  employeeId: string
  email: string
  temporaryPassword: string
  userId: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  statusCode?: number
}

export type Role = 'driver' | 'conductor' | 'supervisor' | 'admin'

// Type guards
export const isResponseV1 = (response: any): response is CreateCrewResponseV1 => {
  return response && 
         typeof response === 'object' && 
         'success' in response && 
         'data' in response
}

export const isResponseV2 = (response: any): response is CreateCrewResponseV2 => {
  return response && 
         typeof response === 'object' && 
         'employeeId' in response && 
         'id' in response
}

// Helper to extract user from any response type
export const extractUserFromResponse = (response: CreateCrewResponse): CrewMember => {
  if (isResponseV1(response)) {
    return response.data.user
  } else {
    return {
      id: response.id,
      employeeId: response.employeeId,
      firstName: response.firstName,
      lastName: response.lastName,
      email: response.email,
      phoneNumber: response.phoneNumber,
      role: response.role,
      saccoId: response.saccoId,
      createdAt: response.createdAt
    }
  }
}

// Helper to extract credentials from any response type
export const extractCredentialsFromResponse = (
  response: CreateCrewResponse, 
  fallbackEmail: string
): Credentials => {
  let employeeId = ''
  let email = fallbackEmail
  let temporaryPassword = ''
  let userId = ''

  if (isResponseV1(response)) {
    // V1 structure
    if (response.data.credentials) {
      employeeId = response.data.credentials.employeeId || response.data.user.employeeId
      email = response.data.credentials.email || response.data.user.email || fallbackEmail
      temporaryPassword = response.data.credentials.temporaryPassword
      userId = response.data.credentials.userId || response.data.user.id || ''
    } else {
      employeeId = response.data.user.employeeId
      email = response.data.user.email || fallbackEmail
      temporaryPassword = `QT@2024${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      userId = response.data.user.id || ''
    }
  } else {
    // V2 structure
    employeeId = response.employeeId
    email = response.email || fallbackEmail
    temporaryPassword = response.temporaryPassword || 
                       response.password || 
                       `QT@2024${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    userId = response.id || response.userId || ''
  }

  return {
    employeeId,
    email,
    temporaryPassword,
    userId
  }
}