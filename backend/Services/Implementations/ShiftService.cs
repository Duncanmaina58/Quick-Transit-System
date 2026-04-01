using Microsoft.EntityFrameworkCore;
using QuickTransit.API.Data;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Services.Implementations;
using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Services.Implementations
{
    public class ShiftService : IShiftService
    {
        private readonly ApplicationDbContext _context;

        public ShiftService(ApplicationDbContext context) => _context = context;

        public async Task<ShiftContextResponse> GetDriverShiftContextAsync(Guid driverId)
        {
            var vehicle = await _context.Vehicles
                .AsNoTracking()
                .Include(v => v.Route)
                .Include(v => v.Conductor)
                .Include(v => v.Sacco)
                .FirstOrDefaultAsync(v => v.DriverId == driverId && v.IsActive);

            if (vehicle == null)
                return new ShiftContextResponse { IsAssigned = false };

            var stops = new List<string>();
            if (!string.IsNullOrWhiteSpace(vehicle.Route?.Stops))
            {
                try { stops = System.Text.Json.JsonSerializer.Deserialize<List<string>>(vehicle.Route.Stops) ?? new(); }
                catch { stops = vehicle.Route.Stops.Split(',').Select(s => s.Trim()).ToList(); }
            }

            return new ShiftContextResponse
            {
                IsAssigned          = true,
                AssignedVehiclePlate = vehicle.RegistrationPlate,
                AssignedVehicleId   = vehicle.Id,
                VehicleCapacity     = vehicle.Capacity,
                AssignedRouteName   = vehicle.Route?.Name,
                AssignedRouteCode   = vehicle.Route?.RouteCode,
                AssignedRouteOrigin = vehicle.Route?.Origin,
                AssignedRouteDestination = vehicle.Route?.Destination,
                RouteStops          = stops,
                AssignedRouteId     = vehicle.RouteId,
                ConductorName       = vehicle.Conductor != null
                    ? $"{vehicle.Conductor.FirstName} {vehicle.Conductor.LastName}" : null,
                ConductorId         = vehicle.ConductorId,
                SaccoName           = vehicle.Sacco?.Name,
            };
        }

        public async Task<ShiftContextResponse> GetConductorShiftContextAsync(Guid conductorId)
        {
            var vehicle = await _context.Vehicles
                .AsNoTracking()
                .Include(v => v.Route)
                .Include(v => v.Driver)
                .Include(v => v.Sacco)
                .FirstOrDefaultAsync(v => v.ConductorId == conductorId && v.IsActive);

            if (vehicle == null)
                return new ShiftContextResponse { IsAssigned = false };

            var stops = new List<string>();
            if (!string.IsNullOrWhiteSpace(vehicle.Route?.Stops))
            {
                try { stops = System.Text.Json.JsonSerializer.Deserialize<List<string>>(vehicle.Route.Stops) ?? new(); }
                catch { stops = vehicle.Route.Stops.Split(',').Select(s => s.Trim()).ToList(); }
            }

            return new ShiftContextResponse
            {
                IsAssigned          = true,
                AssignedVehiclePlate = vehicle.RegistrationPlate,
                AssignedVehicleId   = vehicle.Id,
                VehicleCapacity     = vehicle.Capacity,
                AssignedRouteName   = vehicle.Route?.Name,
                AssignedRouteCode   = vehicle.Route?.RouteCode,
                AssignedRouteOrigin = vehicle.Route?.Origin,
                AssignedRouteDestination = vehicle.Route?.Destination,
                RouteStops          = stops,
                AssignedRouteId     = vehicle.RouteId,
                DriverName          = vehicle.Driver != null
                    ? $"{vehicle.Driver.FirstName} {vehicle.Driver.LastName}" : null,
                DriverId            = vehicle.DriverId,
                SaccoName           = vehicle.Sacco?.Name,
            };
        }
    }
}