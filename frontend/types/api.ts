// ============================================================
// QuickTransit — Complete API Types
// Mirrors the C# DTOs exactly — keep in sync with backend
// ============================================================

// ─────────────────────────────────────────────────────────────
// SHARED / GENERIC
// ─────────────────────────────────────────────────────────────

/** Generic wrapper returned by most endpoints */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

/** Paginated list wrapper */
export interface PagedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface FirstLoginRequest {
  email: string;
  temporaryPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/** Returned by /api/auth/login and /api/auth/first-login */
export interface AuthResponse {
  token: string;
  expiresAt: string;
  forcePasswordChange: boolean;
  user: UserResponse;
}

// ─────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────

export type UserRole = 'driver' | 'conductor' | 'manager' | 'ntsa' | 'admin';

export interface UserResponse {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  saccoId?: string;
  saccoName?: string;
  isActive: boolean;
  forcePasswordChange: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  saccoId?: string;
  sendCredentials: boolean;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  saccoId?: string;
  isActive: boolean;
}

export interface UserUpdateRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface ResetPasswordRequest {
  email: string;
  sendNewPassword: boolean;
}

export interface UserFilterRequest {
  role?: string;
  saccoId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  user: UserResponse;
  temporaryPassword?: string | null;
}

// ─────────────────────────────────────────────────────────────
// SACCO
// ─────────────────────────────────────────────────────────────

export interface SaccoResponse {
  id: string;
  name: string;
  registrationNumber: string;
  address: string;
  county: string;
  contactPhone: string;
  contactEmail: string;
  description?: string;
  isActive: boolean;
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  totalVehicles: number;
  totalCrew: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SaccoSummaryResponse {
  id: string;
  name: string;
  registrationNumber: string;
  isActive: boolean;
  managerName?: string;
}

export interface CreateSaccoRequest {
  name: string;
  registrationNumber: string;
  address: string;
  county: string;
  contactPhone: string;
  contactEmail: string;
  description?: string;
  managerId?: string;
}

export interface UpdateSaccoRequest {
  name: string;
  registrationNumber: string;
  address: string;
  county: string;
  contactPhone: string;
  contactEmail: string;
  description?: string;
  isActive: boolean;
}

export interface SaccoFilterRequest {
  search?: string;
  county?: string;
  isActive?: boolean;
  hasManager?: boolean;
  page?: number;
  pageSize?: number;
}

// ─────────────────────────────────────────────────────────────
// ROUTE
// ─────────────────────────────────────────────────────────────

export interface RouteResponse {
  id: string;
  name: string;
  routeCode: string;
  origin: string;
  destination: string;
  description?: string;
  stops?: string;           // JSON string of stop names
  distanceKm?: number;
  estimatedMinutes?: number;
  isActive: boolean;
  totalVehicles: number;
  createdAt: string;
  updatedAt?: string;
}

export interface RouteSummaryResponse {
  id: string;
  name: string;
  routeCode: string;
  origin: string;
  destination: string;
  isActive: boolean;
}

export interface CreateRouteRequest {
  name: string;
  routeCode: string;
  origin: string;
  destination: string;
  description?: string;
  stops?: string;
  distanceKm?: number;
  estimatedMinutes?: number;
}

export interface UpdateRouteRequest {
  name: string;
  routeCode: string;
  origin: string;
  destination: string;
  description?: string;
  stops?: string;
  distanceKm?: number;
  estimatedMinutes?: number;
  isActive: boolean;
}

export interface RouteFilterRequest {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

// ─────────────────────────────────────────────────────────────
// VEHICLE
// ─────────────────────────────────────────────────────────────

export type VehicleStatusType = 'Active' | 'Maintenance' | 'Inactive' | 'Suspended';

export interface VehicleResponse {
  id: string;
  registrationPlate: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  color: string;
  status: VehicleStatusType;
  isActive: boolean;

  // SACCO
  saccoId: string;
  saccoName?: string;

  // Route — direct FK
  routeId?: string;
  routeName?: string;
  routeCode?: string;

  // Crew
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  conductorId?: string;
  conductorName?: string;
  conductorPhone?: string;

  // Maintenance
  lastServiceDate?: string;
  nextServiceDate?: string;
  mileage?: number;
  maintenanceDue: boolean;

  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface VehicleSummaryResponse {
  id: string;
  registrationPlate: string;
  makeModel: string;
  status: string;
  hasDriver: boolean;
  hasConductor: boolean;
}

export interface CreateVehicleRequest {
  registrationPlate: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  color: string;
  routeId?: string;
  driverId?: string;
  conductorId?: string;
  notes?: string;
}

export interface UpdateVehicleRequest {
  registrationPlate: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  color: string;
  notes?: string;
  isActive: boolean;
}

export interface AssignCrewRequest {
  driverId?: string;
  conductorId?: string;
}

export interface AssignRouteRequest {
  routeId?: string;
}

export interface UpdateVehicleStatusRequest {
  status: VehicleStatusType;
  notes?: string;
}

export interface VehicleFilterRequest {
  search?: string;
  saccoId?: string;
  routeId?: string;
  status?: string;
  hasDriver?: boolean;
  hasConductor?: boolean;   // ← matches backend HasConductor
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

// ─────────────────────────────────────────────────────────────
// MANAGER DASHBOARD
// ─────────────────────────────────────────────────────────────

export interface ManagerDashboardResponse {
  saccoName: string;
  registrationNumber: string;

  // Vehicle counts
  totalVehicles: number;
  activeVehicles: number;
  vehiclesOnMaintenance: number;
  maintenanceDue: number;

  // Crew counts
  totalDrivers: number;
  totalConductors: number;
  unassignedDrivers: number;
  unassignedConductors: number;

  // Other
  totalRoutes: number;
  tripsToday: number;
  violationsThisMonth: number;

  // Recent lists for dashboard widgets
  recentVehicles: VehicleResponse[];
  recentCrew: UserResponse[];
}

// ─────────────────────────────────────────────────────────────
// TRIP
// ─────────────────────────────────────────────────────────────

export type TripStatus       = 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';
export type PassengerLogType = 'Boarding' | 'Alighting' | 'Checkpoint';

export interface PassengerLogResponse {
  id: string;
  passengerCount: number;
  stopName?: string;
  logType: string;
  logTime: string;
}

export interface TripResponse {
  id: string;
  // Vehicle
  vehicleId: string;
  registrationPlate: string;
  vehicleMakeModel: string;
  // Route
  routeId: string;
  routeName: string;
  routeCode: string;
  origin: string;
  destination: string;
  // Crew
  driverId: string;
  driverName: string;
  driverEmployeeId: string;
  conductorId?: string;
  conductorName?: string;
  // SACCO
  saccoId: string;
  saccoName: string;
  // Trip
  status: string;
  scheduledStartTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  initialPassengerCount?: number;
  finalPassengerCount?: number;
  peakPassengerCount?: number;
  durationMinutes?: number;
  notes?: string;
  createdAt: string;
  passengerLogs: PassengerLogResponse[];
}

export interface TripSummaryResponse {
  id: string;
  registrationPlate: string;
  routeCode: string;
  routeName: string;
  driverName: string;
  status: string;
  actualStartTime?: string;
  actualEndTime?: string;
  finalPassengerCount?: number;
  durationMinutes?: number;
  saccoName: string;
}

export interface DriverTripContextResponse {
  hasActiveTrip: boolean;
  activeTrip?: TripResponse;
  assignedVehiclePlate?: string;
  assignedVehicleId?: string;
  assignedRouteName?: string;
  assignedRouteCode?: string;
  assignedRouteId?: string;
  canStartTrip: boolean;
}

export interface StartTripRequest {
  vehicleId: string;
  routeId: string;
  conductorId?: string;
  initialPassengerCount?: number;
  notes?: string;
}

export interface EndTripRequest {
  finalPassengerCount: number;
  notes?: string;
}

export interface LogPassengerRequest {
  passengerCount: number;
  stopName?: string;
  logType: PassengerLogType;   // non-optional — always send explicitly
}

export interface TripFilterRequest {
  saccoId?: string;
  vehicleId?: string;
  driverId?: string;
  routeId?: string;
  status?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  page?: number;
  pageSize?: number;
}

// ─────────────────────────────────────────────────────────────
// ALERT / INCIDENT
// ─────────────────────────────────────────────────────────────

export type IncidentType  = 'Accident' | 'Breakdown' | 'PoliceStop' | 'TrafficJam' | 'Other';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus   = 'active' | 'acknowledged' | 'resolved';

export interface AlertSummaryResponse {
  id: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  vehiclePlate?: string;
  reportedByName?: string;
  createdAt: string;
  resolvedAt?: string;
  tripId?: string;
  vehicleId?: string;
}

export interface CreateIncidentRequest {
  type: string;
  severity: string;
  description: string;
  vehicleId?: string;
  tripId?: string;
}

export interface AcknowledgeAlertRequest {
  notes?: string;
}

export interface AlertFilterRequest {
  saccoId?: string;
  vehicleId?: string;
  status?: string;
  type?: string;
  severity?: string;
  dateFrom?: Date | string;
  page?: number;
  pageSize?: number;
}

// ─────────────────────────────────────────────────────────────
// LIVE TRIP (real-time state — driver + conductor polling)
// ─────────────────────────────────────────────────────────────

export interface LiveTripResponse {
  recentPath: any;
  tripId: string;
  status: string;
  registrationPlate: string;
  routeCode: string;
  routeName: string;
  origin: string;
  destination: string;
  stops: string[];
  conductorName?: string;
  actualStartTime?: string;
  elapsedTime: string;
  currentPassengerCount: number;
  vehicleCapacity: number;
  peakPassengerCount?: number;
  isOverloaded: boolean;
  recentLogs: PassengerLogResponse[];
  activeAlerts: AlertSummaryResponse[];
  // GPS fields
  currentLatitude?: number;
  currentLongitude?: number;
  currentSpeedKmh?: number;
  currentHeading?: number;
  locationHistory: TripLocationResponse[];
}

// ─────────────────────────────────────────────────────────────
// SHIFT CONTEXT (crew assignment info)
// ─────────────────────────────────────────────────────────────

export interface ShiftContextResponse {
  isAssigned: boolean;
  assignedVehiclePlate?: string;
  assignedVehicleId?: string;
  vehicleCapacity?: number;
  assignedRouteName?: string;
  assignedRouteCode?: string;
  assignedRouteOrigin?: string;
  assignedRouteDestination?: string;
  routeStops: string[];
  assignedRouteId?: string;
  conductorName?: string;   // for driver view
  conductorId?: string;
  driverName?: string;      // for conductor view
  driverId?: string;
  saccoName?: string;
}

// ─────────────────────────────────────────────────────────────
// CANCEL TRIP
// ─────────────────────────────────────────────────────────────

export interface CancelTripRequest {
  reason: string;
}

// ─────────────────────────────────────────────────────────────
// GPS / LOCATION
// ─────────────────────────────────────────────────────────────

export interface UpdateLocationRequest {
  latitude:  number;
  longitude: number;
  speed?:    number | null;
  heading?:  number | null;
  accuracy?: number;
}

export interface TripLocationResponse {
  id:         string;
  tripId:     string;
  latitude:   number;
  longitude:  number;
  speed?:     number | null;
  heading?:   number | null;
  recordedAt: string;
}

// ─────────────────────────────────────────────────────────────
// LIVE VEHICLE (fleet tracking)
// ─────────────────────────────────────────────────────────────

export interface LiveVehicleResponse {
  tripId:            string;
  vehicleId:         string;
  registrationPlate: string;
  driverName:        string;
  conductorName:     string;
  routeCode:         string;
  routeName:         string;
  origin:            string;
  destination:       string;
  latitude:          number;
  longitude:         number;
  speed?:            number | null;
  heading?:          number | null;
  currentPassengers: number;
  vehicleCapacity:   number;
  isOverloaded:      boolean;
  lastUpdate:        string;
  tripStatus:        string;
  tripStartTime?:    string;
}

// ─────────────────────────────────────────────────────────────
// LOCATION / GPS TRACKING
// ─────────────────────────────────────────────────────────────

export interface PostLocationRequest {
  latitude:  number;
  longitude: number;
  speed?:    number;   // km/h
  heading?:  number;   // degrees 0–360
  accuracy?: number;   // metres
}

export interface VehicleLocationResponse {
  tripId:            string;
  vehicleId:         string;
  registrationPlate: string;
  driverName:        string;
  conductorName?:    string;
  routeCode:         string;
  routeName:         string;
  origin:            string;
  destination:       string;
  latitude:          number;
  longitude:         number;
  speed?:            number;
  heading?:          number;
  currentPassengers: number;
  vehicleCapacity:   number;
  isOverloaded:      boolean;
  tripStatus:        string;
  lastUpdated:       string;
  elapsedTime:       string;
}

export interface TripLocationPointResponse {
  latitude:   number;
  longitude:  number;
  speed?:     number;
  heading?:   number;
  recordedAt: string;
}

// Extended LiveTripResponse with location fields
// (these are added to the existing interface — update the LiveTripResponse above)
// currentLatitude, currentLongitude, currentSpeed, currentHeading, recentPath

// ─────────────────────────────────────────────────────────────
// GPS / LOCATION TRACKING
// ─────────────────────────────────────────────────────────────

export interface PostLocationRequest {
  latitude: number;
  longitude: number;
  speedKmh?: number;
  heading?: number;
  accuracyMeters?: number;
}

export interface TripLocationResponse {
  latitude: number;
  longitude: number;
  speedKmh?: number;
  heading?:   number | null;
  recordedAt: string;
}

export interface VehicleLiveLocation {
  tripId: string;
  vehicleId: string;
  registrationPlate: string;
  routeCode: string;
  routeName: string;
  driverName: string;
  currentPassengerCount: number;
  vehicleCapacity: number;
  isOverloaded: boolean;
  status: string;
  latitude: number;
  longitude: number;
  speedKmh?: number;
  heading?: number;
  lastSeenAt: string;
  elapsedTime: string;
}

// ─────────────────────────────────────────────────────────────
// MAINTENANCE RECORD (stub)
// ─────────────────────────────────────────────────────────────

export interface MaintenanceRecordResponse {
  id: string;
  vehicleId: string;
  registrationPlate: string;
  maintenanceDate: string;
  description: string;
  cost?: number;
  performedBy?: string;
  nextServiceDate?: string;
  createdAt: string;
}

export interface CreateMaintenanceRecordRequest {
  vehicleId: string;
  maintenanceDate: string;
  description: string;
  cost?: number;
  performedBy?: string;
  nextServiceDate?: string;
}