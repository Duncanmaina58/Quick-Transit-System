import api from './index';
import type {
  ApiResponse,
  PagedResponse,
  DriverTripContextResponse,
  TripResponse,
  TripSummaryResponse,
  StartTripRequest,
  EndTripRequest,
  LogPassengerRequest,
  TripFilterRequest,
} from '@/types/api';

export const driverApi = {
  /** GET /api/trips/my-context — driver's active trip + assignment */
  getMyContext: () =>
    api.get<ApiResponse<DriverTripContextResponse>>('/api/trips/my-context'),

  /** POST /api/trips/start */
  startTrip: (data: StartTripRequest) =>
    api.post<ApiResponse<TripResponse>>('/api/trips/start', data),

  /** POST /api/trips/:id/end */
  endTrip: (tripId: string, data: EndTripRequest) =>
    api.post<ApiResponse<TripResponse>>(`/api/trips/${tripId}/end`, data),

  /** POST /api/trips/:id/cancel */
  cancelTrip: (tripId: string, reason: string) =>
    api.post<ApiResponse<TripResponse>>(`/api/trips/${tripId}/cancel`, reason),

  /** GET /api/trips — driver sees only their own */
  getMyTrips: (filter?: TripFilterRequest) =>
    api.get<PagedResponse<TripSummaryResponse>>('/api/trips', { params: filter }),
};

export const conductorApi = {
  /** POST /api/trips/:id/log-passengers */
  logPassengers: (tripId: string, data: LogPassengerRequest) =>
    api.post<ApiResponse<TripResponse>>(`/api/trips/${tripId}/log-passengers`, data),

  /** GET /api/trips — conductor sees trips they're assigned to */
  getMyTrips: (filter?: TripFilterRequest) =>
    api.get<PagedResponse<TripSummaryResponse>>('/api/trips', { params: filter }),
};