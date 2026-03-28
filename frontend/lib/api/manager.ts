import api from './index';
import type {
  ApiResponse,
  PagedResponse,
  ManagerDashboardResponse,
  VehicleResponse,
  VehicleFilterRequest,
  VehicleSummaryResponse,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  AssignCrewRequest,
  AssignRouteRequest,
  UpdateVehicleStatusRequest,
  RouteResponse,
  RouteFilterRequest,
  RouteSummaryResponse,
  TripFilterRequest,
  TripResponse,
  TripSummaryResponse,
} from '@/types/api';

export const managerApi = {
  // ── Dashboard ──────────────────────────────────────────────────────────────

  /** GET /api/manager/dashboard */
  getDashboard: () =>
    api.get<ApiResponse<ManagerDashboardResponse>>('/api/manager/dashboard'),

  // ── Vehicles ───────────────────────────────────────────────────────────────

  /** GET /api/vehicles — scoped to manager's SACCO by backend */
  getVehicles: (filter?: VehicleFilterRequest) =>
    api.get<PagedResponse<VehicleResponse>>('/api/vehicles', { params: filter }),

  /** GET /api/vehicles/:id */
  getVehicleById: (id: string) =>
    api.get<ApiResponse<VehicleResponse>>(`/api/vehicles/${id}`),

  /** GET /api/vehicles/summaries?saccoId=... */
  getVehicleSummaries: (saccoId: string) =>
    api.get<ApiResponse<VehicleSummaryResponse[]>>('/api/vehicles/summaries', {
      params: { saccoId },
    }),

  /** POST /api/vehicles */
  createVehicle: (data: CreateVehicleRequest) =>
    api.post<ApiResponse<VehicleResponse>>('/api/vehicles', data),

  /** PUT /api/vehicles/:id */
  updateVehicle: (id: string, data: UpdateVehicleRequest) =>
    api.put<ApiResponse<VehicleResponse>>(`/api/vehicles/${id}`, data),

  /** PUT /api/vehicles/:id/assign-crew */
  assignCrew: (id: string, data: AssignCrewRequest) =>
    api.put<ApiResponse<VehicleResponse>>(`/api/vehicles/${id}/assign-crew`, data),

  /** PUT /api/vehicles/:id/assign-route */
  assignRoute: (id: string, data: AssignRouteRequest) =>
    api.put<ApiResponse<VehicleResponse>>(`/api/vehicles/${id}/assign-route`, data),

  /** PUT /api/vehicles/:id/status */
  updateVehicleStatus: (id: string, data: UpdateVehicleStatusRequest) =>
    api.put<ApiResponse<VehicleResponse>>(`/api/vehicles/${id}/status`, data),

  /** DELETE /api/vehicles/:id */
  deleteVehicle: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/vehicles/${id}`),

  // ── Routes (read-only for manager) ────────────────────────────────────────

  /** GET /api/routes */
  getRoutes: (filter?: RouteFilterRequest) =>
    api.get<PagedResponse<RouteResponse>>('/api/routes', { params: filter }),

  /** GET /api/routes/summaries */
  getRouteSummaries: () =>
    api.get<ApiResponse<RouteSummaryResponse[]>>('/api/routes/summaries'),

  // ── Trips ─────────────────────────────────────────────────────────────────

  /** GET /api/trips — manager sees SACCO-scoped trips */
  getTrips: (filter?: TripFilterRequest) =>
    api.get<PagedResponse<TripSummaryResponse>>('/api/trips', { params: filter }),

  /** GET /api/trips/:id */
  getTripById: (id: string) =>
    api.get<ApiResponse<TripResponse>>(`/api/trips/${id}`),
};