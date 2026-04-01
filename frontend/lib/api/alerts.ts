import api from './index';
import type {
  ApiResponse,
  PagedResponse,
  AlertSummaryResponse,
  CreateIncidentRequest,
  AlertFilterRequest,
  AcknowledgeAlertRequest,
  LiveTripResponse,
  ShiftContextResponse,
} from '@/types/api';

export const alertApi = {
  // ── Shift context (driver + conductor) ────────────────────────────────────
  /** GET /api/alerts/my-shift — returns assignment info for the logged-in crew member */
  getMyShift: () =>
    api.get<ApiResponse<ShiftContextResponse>>('/api/alerts/my-shift'),

  // ── Live trip ─────────────────────────────────────────────────────────────
  /** GET /api/alerts/live-trip/:tripId — real-time trip state (pax count, alerts, logs) */
  getLiveTrip: (tripId: string) =>
    api.get<ApiResponse<LiveTripResponse>>(`/api/alerts/live-trip/${tripId}`),

  // ── Incidents ─────────────────────────────────────────────────────────────
  /** POST /api/alerts — driver/conductor reports an incident */
  createIncident: (data: CreateIncidentRequest) =>
    api.post<ApiResponse<AlertSummaryResponse>>('/api/alerts', data),

  // ── Alert management ──────────────────────────────────────────────────────
  /** GET /api/alerts — scoped by role */
  getAlerts: (filter?: AlertFilterRequest) =>
    api.get<PagedResponse<AlertSummaryResponse>>('/api/alerts', { params: filter }),

  /** PUT /api/alerts/:id/acknowledge */
  acknowledgeAlert: (id: string, data: AcknowledgeAlertRequest) =>
    api.put<ApiResponse<AlertSummaryResponse>>(`/api/alerts/${id}/acknowledge`, data),

  /** PUT /api/alerts/:id/resolve */
  resolveAlert: (id: string, notes?: string) =>
    api.put<ApiResponse<AlertSummaryResponse>>(`/api/alerts/${id}/resolve`, notes ?? null),
};