// lib/api/location.ts
import api from './index';
import type { ApiResponse, TripLocationResponse, LiveVehicleResponse } from '@/types/api';

export const locationApi = {
  // ── Driver: push GPS position ─────────────────────────────────────────────
  /** POST /api/trips/:id/location */
  updateLocation: (
    tripId: string,
    data: {
      latitude:  number;
      longitude: number;
      speed?:    number | null;
      heading?:  number | null;
      accuracy?: number;
    }
  ) =>
    api.post<ApiResponse<TripLocationResponse>>(
      `/api/trips/${tripId}/location`,
      data
    ),

  // ── Get full GPS trail for a trip ─────────────────────────────────────────
  /** GET /api/trips/:id/locations */
  getTripLocations: (tripId: string) =>
    api.get<ApiResponse<TripLocationResponse[]>>(
      `/api/trips/${tripId}/locations`
    ),

  // ── Latest single position ────────────────────────────────────────────────
  /** GET /api/trips/:id/location/latest */
  getLatestLocation: (tripId: string) =>
    api.get<ApiResponse<TripLocationResponse>>(
      `/api/trips/${tripId}/location/latest`
    ),

  // ── Manager/Admin: all live vehicles ──────────────────────────────────────
  /** GET /api/fleet/live */
  getLiveFleet: () =>
    api.get<ApiResponse<LiveVehicleResponse[]>>('/api/fleet/live'),
};