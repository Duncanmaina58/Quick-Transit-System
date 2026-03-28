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
  logType?: PassengerLogType;
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
// ALERT / VIOLATION (stub — expand when building violations)
// ─────────────────────────────────────────────────────────────

export type AlertType     = 'Overloading' | 'OffRoute' | 'SafetyViolation' | 'Breakdown' | 'Accident' | 'Other';
export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type AlertStatus   = 'Open' | 'Acknowledged' | 'Resolved' | 'Dismissed';

export interface AlertResponse {
  id: string;
  tripId?: string;
  vehicleId: string;
  registrationPlate: string;
  reportedById: string;
  reportedByName: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  description: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface CreateAlertRequest {
  tripId?: string;
  vehicleId: string;
  type: AlertType;
  severity: AlertSeverity;
  description: string;
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