using Microsoft.EntityFrameworkCore;
using QuickTransit.API.Data;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Models.Entities;
using QuickTransit.API.Services.Interfaces;
using RouteEntity = QuickTransit.API.Models.Entities.Route;

namespace QuickTransit.API.Services.Implementations
{
    public class TripService : ITripService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TripService> _logger;

        public TripService(ApplicationDbContext context, ILogger<TripService> logger)
        {
            _context = context;
            _logger  = logger;
        }

        // ── DRIVER CONTEXT ────────────────────────────────────────────────────

        public async Task<DriverTripContextResponse> GetDriverContextAsync(Guid driverId)
        {
            // Get driver's assigned vehicle and route
            var vehicle = await _context.Vehicles
                .Include(v => v.Route)
                .FirstOrDefaultAsync(v => v.DriverId == driverId && v.IsActive);

            // Check for active trip
            var activeTrip = await _context.Trips
                .Include(t => t.Vehicle)
                .Include(t => t.Route)
                .Include(t => t.Conductor)
                .Include(t => t.PassengerLogs.OrderBy(pl => pl.LogTime))
                .FirstOrDefaultAsync(t =>
                    t.DriverId == driverId &&
                    t.Status == TripStatus.InProgress);

            return new DriverTripContextResponse
            {
                HasActiveTrip       = activeTrip != null,
                ActiveTrip          = activeTrip != null ? MapToTripResponse(activeTrip) : null,
                AssignedVehiclePlate = vehicle?.RegistrationPlate,
                AssignedVehicleId   = vehicle?.Id,
                AssignedRouteName   = vehicle?.Route?.Name,
                AssignedRouteCode   = vehicle?.Route?.RouteCode,
                AssignedRouteId     = vehicle?.RouteId,
                CanStartTrip        = vehicle != null && vehicle.RouteId != null && activeTrip == null,
            };
        }

        // ── START TRIP ────────────────────────────────────────────────────────

        public async Task<TripResponse> StartTripAsync(StartTripRequest request, Guid driverId)
        {
            // Validate driver is assigned to this vehicle
            var vehicle = await _context.Vehicles
                .Include(v => v.Sacco)
                .Include(v => v.Route)
                .Include(v => v.Conductor)
                .FirstOrDefaultAsync(v => v.Id == request.VehicleId && v.IsActive);

            if (vehicle == null)
                throw new Exception("Vehicle not found or inactive.");
            if (vehicle.DriverId != driverId)
                throw new Exception("You are not assigned to this vehicle.");
            if (vehicle.Status != VehicleStatus.Active)
                throw new Exception($"Vehicle is currently {vehicle.Status} and cannot start a trip.");

            // Validate route
            var route = await _context.Routes.FindAsync(request.RouteId);
            if (route == null || !route.IsActive)
                throw new Exception("Route not found or inactive.");

            // Check no active trip already
            var hasActive = await _context.Trips
                .AnyAsync(t => t.DriverId == driverId && t.Status == TripStatus.InProgress);
            if (hasActive)
                throw new Exception("You already have an active trip in progress. End it before starting a new one.");

            // Also check vehicle isn't on another trip
            var vehicleActive = await _context.Trips
                .AnyAsync(t => t.VehicleId == request.VehicleId && t.Status == TripStatus.InProgress);
            if (vehicleActive)
                throw new Exception("This vehicle already has an active trip.");

            var conductorId = request.ConductorId ?? vehicle.ConductorId;

            var trip = new Trip
            {
                Id                    = Guid.NewGuid(),
                VehicleId             = request.VehicleId,
                RouteId               = request.RouteId,
                DriverId              = driverId,
                ConductorId           = conductorId,
                Status                = TripStatus.InProgress,
                ActualStartTime       = DateTime.UtcNow,
                InitialPassengerCount = request.InitialPassengerCount ?? 0,
                PeakPassengerCount    = request.InitialPassengerCount ?? 0,
                Notes                 = request.Notes?.Trim(),
                CreatedAt             = DateTime.UtcNow,
            };

            // Log initial passengers if provided
            if (request.InitialPassengerCount.HasValue && request.InitialPassengerCount > 0)
            {
                trip.PassengerLogs.Add(new PassengerLog
                {
                    Id             = Guid.NewGuid(),
                    TripId         = trip.Id,
                    PassengerCount = request.InitialPassengerCount.Value,
                    LogType        = PassengerLogType.Boarding,
                    StopName       = route.Origin,
                    LogTime        = DateTime.UtcNow,
                });
            }

            _context.Trips.Add(trip);
            await _context.SaveChangesAsync();

            return await GetTripByIdInternalAsync(trip.Id);
        }

        // ── END TRIP ──────────────────────────────────────────────────────────

        public async Task<TripResponse> EndTripAsync(Guid tripId, EndTripRequest request, Guid driverId)
        {
            var trip = await _context.Trips
                .Include(t => t.PassengerLogs)
                .FirstOrDefaultAsync(t => t.Id == tripId);

            if (trip == null) throw new Exception("Trip not found.");
            if (trip.DriverId != driverId)
                throw new Exception("You can only end your own trips.");
            if (trip.Status != TripStatus.InProgress)
                throw new Exception($"Trip is {trip.Status} and cannot be ended.");

            var peak = trip.PassengerLogs.Any()
                ? trip.PassengerLogs.Max(pl => pl.PassengerCount)
                : request.FinalPassengerCount;

            trip.Status              = TripStatus.Completed;
            trip.ActualEndTime       = DateTime.UtcNow;
            trip.FinalPassengerCount = request.FinalPassengerCount;
            trip.PeakPassengerCount  = Math.Max(peak, trip.PeakPassengerCount ?? 0);
            trip.UpdatedAt           = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(request.Notes))
                trip.Notes = request.Notes.Trim();

            // Log final passenger count
            trip.PassengerLogs.Add(new PassengerLog
            {
                Id             = Guid.NewGuid(),
                TripId         = trip.Id,
                PassengerCount = request.FinalPassengerCount,
                LogType        = PassengerLogType.Checkpoint,
                StopName       = "Trip End",
                LogTime        = DateTime.UtcNow,
            });

            await _context.SaveChangesAsync();
            return await GetTripByIdInternalAsync(tripId);
        }

        // ── CANCEL TRIP ───────────────────────────────────────────────────────

        public async Task<TripResponse> CancelTripAsync(Guid tripId, string reason, Guid driverId)
        {
            var trip = await _context.Trips.FindAsync(tripId);
            if (trip == null) throw new Exception("Trip not found.");
            if (trip.DriverId != driverId)
                throw new Exception("You can only cancel your own trips.");
            if (trip.Status == TripStatus.Completed)
                throw new Exception("Cannot cancel a completed trip.");

            trip.Status    = TripStatus.Cancelled;
            trip.Notes     = string.IsNullOrWhiteSpace(reason) ? trip.Notes : $"Cancelled: {reason}";
            trip.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetTripByIdInternalAsync(tripId);
        }

        // ── LOG PASSENGERS (conductor) ────────────────────────────────────────

        public async Task<TripResponse> LogPassengersAsync(Guid tripId, LogPassengerRequest request, Guid conductorId)
        {
            var trip = await _context.Trips
                .Include(t => t.PassengerLogs)
                .FirstOrDefaultAsync(t => t.Id == tripId);

            if (trip == null) throw new Exception("Trip not found.");
            if (trip.ConductorId != conductorId)
                throw new Exception("You are not assigned to this trip.");
            if (trip.Status != TripStatus.InProgress)
                throw new Exception("Can only log passengers for trips in progress.");

            var log = new PassengerLog
            {
                Id             = Guid.NewGuid(),
                TripId         = tripId,
                PassengerCount = request.PassengerCount,
                LogType        = request.LogType,
                StopName       = request.StopName?.Trim(),
                LogTime        = DateTime.UtcNow,
            };
            _context.PassengerLogs.Add(log);

            // Update peak
            if (request.PassengerCount > (trip.PeakPassengerCount ?? 0))
                trip.PeakPassengerCount = request.PassengerCount;

            trip.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return await GetTripByIdInternalAsync(tripId);
        }

        // ── GET TRIP BY ID ────────────────────────────────────────────────────

        public async Task<TripResponse> GetTripByIdAsync(Guid tripId, Guid requesterId, string role)
        {
            var trip = await GetTripByIdInternalAsync(tripId);

            if (role == "manager")
            {
                var saccoId = await GetSaccoIdAsync(requesterId);
                if (trip.SaccoId != saccoId)
                    throw new UnauthorizedAccessException("You can only view trips in your SACCO.");
            }
            else if (role == "driver")
            {
                if (trip.DriverId != requesterId)
                    throw new UnauthorizedAccessException("You can only view your own trips.");
            }
            else if (role == "conductor")
            {
                if (trip.ConductorId != requesterId)
                    throw new UnauthorizedAccessException("You can only view trips you are assigned to.");
            }

            return trip;
        }

        // ── GET TRIPS (paged) ─────────────────────────────────────────────────

        public async Task<PagedResponse<TripSummaryResponse>> GetTripsAsync(
            TripFilterRequest filter, Guid requesterId, string role)
        {
            // Scope by role
            if (role == "manager")
                filter.SaccoId = await GetSaccoIdAsync(requesterId);
            else if (role == "driver")
                filter.DriverId = requesterId;
            else if (role == "conductor")
            {
                // Conductors see trips they're assigned to
                return await QueryTripsAsync(filter, conductorId: requesterId);
            }

            return await QueryTripsAsync(filter);
        }

        public async Task<PagedResponse<TripSummaryResponse>> GetAllTripsAsync(TripFilterRequest filter)
            => await QueryTripsAsync(filter);

        // ── PRIVATE ───────────────────────────────────────────────────────────

        private async Task<PagedResponse<TripSummaryResponse>> QueryTripsAsync(
            TripFilterRequest filter, Guid? conductorId = null)
        {
            var query = _context.Trips
                .Include(t => t.Vehicle).ThenInclude(v => v.Sacco)
                .Include(t => t.Route)
                .Include(t => t.Driver)
                .Include(t => t.Conductor)
                .AsQueryable();

            // Conductor scoping
            if (conductorId.HasValue)
                query = query.Where(t => t.ConductorId == conductorId);

            // Filters
            if (filter.SaccoId.HasValue)
                query = query.Where(t => t.Vehicle.SaccoId == filter.SaccoId);

            if (filter.VehicleId.HasValue)
                query = query.Where(t => t.VehicleId == filter.VehicleId);

            if (filter.DriverId.HasValue)
                query = query.Where(t => t.DriverId == filter.DriverId);

            if (filter.RouteId.HasValue)
                query = query.Where(t => t.RouteId == filter.RouteId);

            if (!string.IsNullOrWhiteSpace(filter.Status) &&
                Enum.TryParse<TripStatus>(filter.Status, true, out var statusEnum))
                query = query.Where(t => t.Status == statusEnum);

            if (filter.DateFrom.HasValue)
                query = query.Where(t => t.ActualStartTime >= filter.DateFrom);

            if (filter.DateTo.HasValue)
                query = query.Where(t => t.ActualStartTime <= filter.DateTo.Value.AddDays(1));

            var total = await query.CountAsync();
            var trips = await query
                .OrderByDescending(t => t.ActualStartTime ?? t.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResponse<TripSummaryResponse>
            {
                Data      = trips.Select(MapToSummary).ToList(),
                Page      = filter.Page,
                PageSize  = filter.PageSize,
                TotalCount = total,
            };
        }

        private async Task<TripResponse> GetTripByIdInternalAsync(Guid tripId)
        {
            var trip = await _context.Trips
                .Include(t => t.Vehicle).ThenInclude(v => v.Sacco)
                .Include(t => t.Route)
                .Include(t => t.Driver)
                .Include(t => t.Conductor)
                .Include(t => t.PassengerLogs.OrderBy(pl => pl.LogTime))
                .FirstOrDefaultAsync(t => t.Id == tripId);

            if (trip == null) throw new Exception("Trip not found.");
            return MapToTripResponse(trip);
        }

        private async Task<Guid> GetSaccoIdAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user?.SaccoId == null)
                throw new Exception("User is not assigned to a SACCO.");
            return user.SaccoId.Value;
        }

        private static TripResponse MapToTripResponse(Trip t) => new()
        {
            Id                    = t.Id,
            VehicleId             = t.VehicleId,
            RegistrationPlate     = t.Vehicle?.RegistrationPlate ?? string.Empty,
            VehicleMakeModel      = t.Vehicle != null ? $"{t.Vehicle.Make} {t.Vehicle.Model}" : string.Empty,
            RouteId               = t.RouteId,
            RouteName             = t.Route?.Name ?? string.Empty,
            RouteCode             = t.Route?.RouteCode ?? string.Empty,
            Origin                = t.Route?.Origin ?? string.Empty,
            Destination           = t.Route?.Destination ?? string.Empty,
            DriverId              = t.DriverId,
            DriverName            = t.Driver != null ? $"{t.Driver.FirstName} {t.Driver.LastName}" : string.Empty,
            DriverEmployeeId      = t.Driver?.EmployeeId ?? string.Empty,
            ConductorId           = t.ConductorId,
            ConductorName         = t.Conductor != null ? $"{t.Conductor.FirstName} {t.Conductor.LastName}" : null,
            SaccoId               = t.Vehicle?.SaccoId ?? Guid.Empty,
            SaccoName             = t.Vehicle?.Sacco?.Name ?? string.Empty,
            Status                = t.Status.ToString(),
            ScheduledStartTime    = t.ScheduledStartTime,
            ActualStartTime       = t.ActualStartTime,
            ActualEndTime         = t.ActualEndTime,
            InitialPassengerCount = t.InitialPassengerCount,
            FinalPassengerCount   = t.FinalPassengerCount,
            PeakPassengerCount    = t.PeakPassengerCount,
            DurationMinutes       = t.ActualStartTime.HasValue && t.ActualEndTime.HasValue
                ? (t.ActualEndTime.Value - t.ActualStartTime.Value).TotalMinutes
                : null,
            Notes       = t.Notes,
            CreatedAt   = t.CreatedAt,
            PassengerLogs = t.PassengerLogs.Select(pl => new PassengerLogResponse
            {
                Id             = pl.Id,
                PassengerCount = pl.PassengerCount,
                StopName       = pl.StopName,
                LogType        = pl.LogType.ToString(),
                LogTime        = pl.LogTime,
            }).ToList(),
        };

        private static TripSummaryResponse MapToSummary(Trip t) => new()
        {
            Id                  = t.Id,
            RegistrationPlate   = t.Vehicle?.RegistrationPlate ?? string.Empty,
            RouteCode           = t.Route?.RouteCode ?? string.Empty,
            RouteName           = t.Route?.Name ?? string.Empty,
            DriverName          = t.Driver != null ? $"{t.Driver.FirstName} {t.Driver.LastName}" : string.Empty,
            Status              = t.Status.ToString(),
            ActualStartTime     = t.ActualStartTime,
            ActualEndTime       = t.ActualEndTime,
            FinalPassengerCount = t.FinalPassengerCount,
            DurationMinutes     = t.ActualStartTime.HasValue && t.ActualEndTime.HasValue
                ? (t.ActualEndTime.Value - t.ActualStartTime.Value).TotalMinutes
                : null,
            SaccoName = t.Vehicle?.Sacco?.Name ?? string.Empty,
        };
    }
}