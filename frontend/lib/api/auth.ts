import api from './index';
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  FirstLoginRequest,
  ChangePasswordRequest,
  UserUpdateRequest,
  UserResponse,
} from '@/types/api';

export const authApi = {
  /** POST /api/auth/login */
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/api/auth/login', data),

  /** POST /api/auth/first-login */
  firstLogin: (data: FirstLoginRequest) =>
    api.post<AuthResponse>('/api/auth/first-login', data),

  /** POST /api/auth/change-password */
  changePassword: (data: ChangePasswordRequest) =>
    api.post<ApiResponse<null>>('/api/auth/change-password', data),

  /** GET /api/auth/me */
  getProfile: () =>
    api.get<ApiResponse<UserResponse>>('/api/auth/me'),

  /** PUT /api/auth/me */
  updateProfile: (data: UserUpdateRequest) =>
    api.put<ApiResponse<UserResponse>>('/api/auth/me', data),
};