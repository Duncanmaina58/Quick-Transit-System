import api from './index';
import type {
  ApiResponse,
  PagedResponse,
  // User
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UserFilterRequest,
  UserResponse,
  ResetPasswordRequest,
  // SACCO
  CreateSaccoRequest,
  UpdateSaccoRequest,
  SaccoFilterRequest,
  SaccoResponse,
  SaccoSummaryResponse,
  // Route
  CreateRouteRequest,
  UpdateRouteRequest,
  RouteFilterRequest,
  RouteResponse,
  RouteSummaryResponse,
  // Vehicle
  VehicleFilterRequest,
  VehicleResponse,
  VehicleSummaryResponse,
} from '@/types/api';

export const adminApi = {

  // ── User Management ────────────────────────────────────────────────────────

  /** POST /api/admin/users/create */
  createUser: (data: CreateUserRequest) =>
    api.post<CreateUserResponse>('/api/admin/users/create', data),

  /** GET /api/admin/users */
  getAllUsers: (filter?: UserFilterRequest) =>
    api.get<PagedResponse<UserResponse>>('/api/admin/users', { params: filter }),

  /** GET /api/admin/users/:id */
  getUserById: (userId: string) =>
    api.get<ApiResponse<UserResponse>>(`/api/admin/users/${userId}`),

  /** PUT /api/admin/users/:id */
  updateUser: (userId: string, data: UpdateUserRequest) =>
    api.put<ApiResponse<UserResponse>>(`/api/admin/users/${userId}`, data),

  /** PUT /api/admin/users/:id/activate */
  activateUser: (userId: string, isActive: boolean) =>
    api.put<ApiResponse<null>>(`/api/admin/users/${userId}/activate`, isActive),

  /** POST /api/admin/users/reset-password */
  resetPassword: (data: ResetPasswordRequest) =>
    api.post<ApiResponse<null>>('/api/admin/users/reset-password', data),

  // ── SACCO Management ───────────────────────────────────────────────────────

  /** GET /api/admin/saccos */
  getSaccos: (filter?: SaccoFilterRequest) =>
    api.get<PagedResponse<SaccoResponse>>('/api/admin/saccos', { params: filter }),

  /** GET /api/admin/saccos/summaries — for dropdowns */
  getSaccoSummaries: () =>
    api.get<ApiResponse<SaccoSummaryResponse[]>>('/api/admin/saccos/summaries'),

  /** GET /api/admin/saccos/:id */
  getSaccoById: (id: string) =>
    api.get<ApiResponse<SaccoResponse>>(`/api/admin/saccos/${id}`),

  /** POST /api/admin/saccos */
  createSacco: (data: CreateSaccoRequest) =>
    api.post<ApiResponse<SaccoResponse>>('/api/admin/saccos', data),

  /** PUT /api/admin/saccos/:id */
  updateSacco: (id: string, data: UpdateSaccoRequest) =>
    api.put<ApiResponse<SaccoResponse>>(`/api/admin/saccos/${id}`, data),

  /** PUT /api/admin/saccos/:id/assign-manager */
  assignManager: (saccoId: string, managerId: string) =>
    api.put<ApiResponse<SaccoResponse>>(
      `/api/admin/saccos/${saccoId}/assign-manager`,
      { managerId }
    ),

  /** DELETE /api/admin/saccos/:id/manager */
  removeManager: (saccoId: string) =>
    api.delete<ApiResponse<SaccoResponse>>(`/api/admin/saccos/${saccoId}/manager`),

  /** PUT /api/admin/saccos/:id/activate */
  activateSacco: (id: string, isActive: boolean) =>
    api.put<ApiResponse<null>>(`/api/admin/saccos/${id}/activate`, isActive),

  /** DELETE /api/admin/saccos/:id */
  deleteSacco: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/admin/saccos/${id}`),

  // ── Route Management (admin creates/edits, all roles read) ─────────────────

  /** GET /api/routes */
  getRoutes: (filter?: RouteFilterRequest) =>
    api.get<PagedResponse<RouteResponse>>('/api/routes', { params: filter }),

  /** GET /api/routes/summaries */
  getRouteSummaries: () =>
    api.get<ApiResponse<RouteSummaryResponse[]>>('/api/routes/summaries'),

  /** GET /api/routes/:id */
  getRouteById: (id: string) =>
    api.get<ApiResponse<RouteResponse>>(`/api/routes/${id}`),

  /** POST /api/routes — admin only */
  createRoute: (data: CreateRouteRequest) =>
    api.post<ApiResponse<RouteResponse>>('/api/routes', data),

  /** PUT /api/routes/:id — admin only */
  updateRoute: (id: string, data: UpdateRouteRequest) =>
    api.put<ApiResponse<RouteResponse>>(`/api/routes/${id}`, data),

  /** PUT /api/routes/:id/activate — admin only */
  activateRoute: (id: string, isActive: boolean) =>
    api.put<ApiResponse<null>>(`/api/routes/${id}/activate`, isActive),

  /** DELETE /api/routes/:id — admin only */
  deleteRoute: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/routes/${id}`),

  // ── Vehicles (admin sees all) ──────────────────────────────────────────────

  /** GET /api/vehicles — admin gets all, manager gets scoped */
  getVehicles: (filter?: VehicleFilterRequest) =>
    api.get<PagedResponse<VehicleResponse>>('/api/vehicles', { params: filter }),

  /** GET /api/vehicles/summaries */
  getVehicleSummaries: (saccoId: string) =>
    api.get<ApiResponse<VehicleSummaryResponse[]>>('/api/vehicles/summaries', {
      params: { saccoId },
    }),
};