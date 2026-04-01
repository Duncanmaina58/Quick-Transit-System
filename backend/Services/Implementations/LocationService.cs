using Microsoft.EntityFrameworkCore;
using QuickTransit.API.Data;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Models.Entities;
using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Services.Implementations
{
    public class LocationService : ILocationService
    {
        private readonly ApplicationDbContext _context;

        public LocationService(ApplicationDbContext context) => _context = context;

        // ── Driver posts location ─────────────────────────────────────────────
        public async Task PostLocationAsync(
            Guid tripId, PostLocationRequest request, Guid driverId)
        {
            // Verify trip belongs to driver and is active
            var trip = await _context.Trips
                .FirstOrDefaultAsync(t =>
                    t.Id == tripId &&
                    t.DriverId == driverId &&
                    t.Status == TripStatus.InProgress);

            if (trip == null)
                throw new Exception("No active trip found for this driver.");

            var point = new TripLocation
            {
                Id         = Guid.NewGuid(),
                TripId     = tripId,
                Latitude   = request.Latitude,
                Longitude  = request.Longitude,
                Speed      = request.Speed,
                Heading    = request.Heading,
                Accuracy   = request.Accuracy,
                RecordedAt = DateTime.UtcNow,
            };

            _context.TripLocations.Add(point);
            await _context.SaveChangesAsync();
        }

        // ── Manager: all active vehicles in their SACCO ────────────────────────
        public async Task<List<VehicleLocationResponse>> GetActiveVehicleLocationsAsync(
            Guid managerId)
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == managerId);

            if (user?.SaccoId == null) return new();

            // Get all InProgress trips for this SACCO that have location data
            var trips = await _context.Trips
                .AsNoTracking()
                .Include(t => t.Vehicle).ThenInclude(v => v.Sacco)
                .Include(t => t.Route)
                .Include(t => t.Driver)
                .Include(t => t.Conductor)
                .Include(t => t.PassengerLogs
                    .OrderByDescending(pl => pl.LogTime).Take(1))
                .Where(t =>
                    t.Status == TripStatus.InProgress &&
                    t.Vehicle.SaccoId == user.SaccoId)
                .ToListAsync();

            var result = new List<VehicleLocationResponse>();

            foreach (var trip in trips)
            {
                // Get latest location for this trip
                var loc = await _context.TripLocations
                    .AsNoTracking()
                    .Where(tl => tl.TripId == trip.Id)
                    .OrderByDescending(tl => tl.RecordedAt)
                    .FirstOrDefaultAsync();

                if (loc == null) continue; // skip vehicles with no location yet

                var latestPax = trip.PassengerLogs.FirstOrDefault()?.PassengerCount
                    ?? trip.InitialPassengerCount ?? 0;
                var capacity = trip.Vehicle?.Capacity ?? 14;

                result.Add(new VehicleLocationResponse
                {
                    TripId            = trip.Id,
                    VehicleId         = trip.VehicleId,
                    RegistrationPlate = trip.Vehicle?.RegistrationPlate ?? string.Empty,
                    DriverName        = trip.Driver != null
                        ? $"{trip.Driver.FirstName} {trip.Driver.LastName}" : string.Empty,
                    ConductorName     = trip.Conductor != null
                        ? $"{trip.Conductor.FirstName} {trip.Conductor.LastName}" : null,
                    RouteCode         = trip.Route?.RouteCode ?? string.Empty,
                    RouteName         = trip.Route?.Name ?? string.Empty,
                    Origin            = trip.Route?.Origin ?? string.Empty,
                    Destination       = trip.Route?.Destination ?? string.Empty,
                    Latitude          = loc.Latitude,
                    Longitude         = loc.Longitude,
                    Speed             = loc.Speed,
                    Heading           = loc.Heading,
                    CurrentPassengers = latestPax,
                    VehicleCapacity   = capacity,
                    IsOverloaded      = latestPax > capacity,
                    TripStatus        = trip.Status.ToString(),
                    LastUpdated       = loc.RecordedAt,
                    ElapsedTime       = trip.ActualStartTime.HasValue
                        ? FormatElapsed(DateTime.UtcNow - trip.ActualStartTime.Value)
                        : "00:00:00",
                });
            }

            return result;
        }

        // ── Trip path (breadcrumb trail) ───────────────────────────────────────
        public async Task<List<TripLocationPointResponse>> GetTripPathAsync(Guid tripId)
        {
            var points = await _context.TripLocations
                .AsNoTracking()
                .Where(tl => tl.TripId == tripId)
                .OrderBy(tl => tl.RecordedAt)
                .Select(tl => new TripLocationPointResponse
                {
                    Latitude   = tl.Latitude,
                    Longitude  = tl.Longitude,
                    Speed      = tl.Speed,
                    Heading    = tl.Heading,
                    RecordedAt = tl.RecordedAt,
                })
                .ToListAsync();

            return points;
        }

        // ── Single vehicle location ────────────────────────────────────────────
        public async Task<VehicleLocationResponse?> GetVehicleLocationAsync(Guid tripId)
        {
            var trip = await _context.Trips
                .AsNoTracking()
                .Include(t => t.Vehicle)
                .Include(t => t.Route)
                .Include(t => t.Driver)
                .Include(t => t.Conductor)
                .FirstOrDefaultAsync(t => t.Id == tripId);

            if (trip == null) return null;

            var loc = await _context.TripLocations
                .AsNoTracking()
                .Where(tl => tl.TripId == tripId)
                .OrderByDescending(tl => tl.RecordedAt)
                .FirstOrDefaultAsync();

            if (loc == null) return null;

            return new VehicleLocationResponse
            {
                TripId            = trip.Id,
                VehicleId         = trip.VehicleId,
                RegistrationPlate = trip.Vehicle?.RegistrationPlate ?? string.Empty,
                DriverName        = trip.Driver != null
                    ? $"{trip.Driver.FirstName} {trip.Driver.LastName}" : string.Empty,
                ConductorName     = trip.Conductor != null
                    ? $"{trip.Conductor.FirstName} {trip.Conductor.LastName}" : null,
                RouteCode         = trip.Route?.RouteCode ?? string.Empty,
                RouteName         = trip.Route?.Name ?? string.Empty,
                Origin            = trip.Route?.Origin ?? string.Empty,
                Destination       = trip.Route?.Destination ?? string.Empty,
                Latitude          = loc.Latitude,
                Longitude         = loc.Longitude,
                Speed             = loc.Speed,
                Heading           = loc.Heading,
                TripStatus        = trip.Status.ToString(),
                LastUpdated       = loc.RecordedAt,
                ElapsedTime       = trip.ActualStartTime.HasValue
                    ? FormatElapsed(DateTime.UtcNow - trip.ActualStartTime.Value)
                    : "00:00:00",
            };
        }

        private static string FormatElapsed(TimeSpan ts) =>
            $"{(int)ts.TotalHours:00}:{ts.Minutes:00}:{ts.Seconds:00}";
    }
}