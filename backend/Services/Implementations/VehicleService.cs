using Microsoft.EntityFrameworkCore;
using QuickTransit.API.Data;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Models.Entities;
using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Services.Implementations
{
    public class VehicleService : IVehicleService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<VehicleService> _logger;

        public VehicleService(ApplicationDbContext context, ILogger<VehicleService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ── CREATE ────────────────────────────────────────────────────────────

        public async Task<VehicleResponse> CreateVehicleAsync(CreateVehicleRequest request, Guid managerId)
        {
            var manager = await _context.Users.FindAsync(managerId);
            if (manager?.SaccoId == null)
                throw new Exception("Manager is not assigned to a SACCO.");

            var exists = await _context.Vehicles
                .AnyAsync(v => v.RegistrationPlate.ToUpper() == request.RegistrationPlate.ToUpper().Trim());
            if (exists)
                throw new Exception($"Vehicle with plate '{request.RegistrationPlate}' already exists.");

            if (request.DriverId.HasValue)
                await ValidateCrewMemberAsync(request.DriverId.Value, manager.SaccoId.Value, "driver");
            if (request.ConductorId.HasValue)
                await ValidateCrewMemberAsync(request.ConductorId.Value, manager.SaccoId.Value, "conductor");

            if (request.RouteId.HasValue)
            {
                var routeExists = await _context.Routes.AnyAsync(r => r.Id == request.RouteId && r.IsActive);
                if (!routeExists) throw new Exception("Selected route does not exist or is inactive.");
            }

            var vehicle = new Vehicle
            {
                Id           = Guid.NewGuid(),
                RegistrationPlate = request.RegistrationPlate.ToUpper().Trim(),
                Make         = request.Make.Trim(),
                Model        = request.Model.Trim(),
                Year         = request.Year,
                Capacity     = request.Capacity,
                Color        = request.Color.Trim(),
                SaccoId      = manager.SaccoId.Value,
                RouteId      = request.RouteId,
                DriverId     = request.DriverId,
                ConductorId  = request.ConductorId,
                Notes        = request.Notes?.Trim(),
                Status       = VehicleStatus.Active,
                IsActive     = true,
                CreatedAt    = DateTime.UtcNow,
                CreatedById  = managerId,
            };

            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            return await GetVehicleByIdInternalAsync(vehicle.Id);
        }

        // ── GET BY ID ─────────────────────────────────────────────────────────

        public async Task<VehicleResponse> GetVehicleByIdAsync(Guid vehicleId, Guid requesterId, string requesterRole)
        {
            var vehicle = await GetVehicleByIdInternalAsync(vehicleId);

            if (requesterRole == "manager")
            {
                var managerSaccoId = await GetManagerSaccoIdAsync(requesterId);
                if (vehicle.SaccoId != managerSaccoId)
                    throw new UnauthorizedAccessException("You can only view vehicles in your SACCO.");
            }

            return vehicle;
        }

        // ── GET ALL ───────────────────────────────────────────────────────────

        public async Task<PagedResponse<VehicleResponse>> GetVehiclesAsync(
            VehicleFilterRequest filter, Guid requesterId, string requesterRole)
        {
            if (requesterRole == "manager")
                filter.SaccoId = await GetManagerSaccoIdAsync(requesterId);

            var query = _context.Vehicles
                .Include(v => v.Sacco)
                .Include(v => v.Route)
                .Include(v => v.Driver)
                .Include(v => v.Conductor)
                .AsQueryable();

            if (filter.SaccoId.HasValue)
                query = query.Where(v => v.SaccoId == filter.SaccoId);

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var s = filter.Search.ToLower();
                query = query.Where(v =>
                    v.RegistrationPlate.ToLower().Contains(s) ||
                    v.Make.ToLower().Contains(s) ||
                    v.Model.ToLower().Contains(s));
            }

            if (filter.RouteId.HasValue)
                query = query.Where(v => v.RouteId == filter.RouteId);

            if (!string.IsNullOrWhiteSpace(filter.Status) &&
                Enum.TryParse<VehicleStatus>(filter.Status, true, out var statusEnum))
                query = query.Where(v => v.Status == statusEnum);

            if (filter.HasDriver.HasValue)
                query = filter.HasDriver.Value
                    ? query.Where(v => v.DriverId != null)
                    : query.Where(v => v.DriverId == null);

            if (filter.HasConductor.HasValue)
                query = filter.HasConductor.Value
                    ? query.Where(v => v.ConductorId != null)
                    : query.Where(v => v.ConductorId == null);

            if (filter.IsActive.HasValue)
                query = query.Where(v => v.IsActive == filter.IsActive);

            var total = await query.CountAsync();
            var vehicles = await query
                .OrderByDescending(v => v.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResponse<VehicleResponse>
            {
                Data = vehicles.Select(MapToResponse).ToList(),
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalCount = total,
            };
        }

        // ── SUMMARIES ─────────────────────────────────────────────────────────

        public async Task<List<VehicleSummaryResponse>> GetVehicleSummariesAsync(Guid saccoId)
        {
            return await _context.Vehicles
                .Where(v => v.SaccoId == saccoId && v.IsActive)
                .OrderBy(v => v.RegistrationPlate)
                .Select(v => new VehicleSummaryResponse
                {
                    Id                = v.Id,
                    RegistrationPlate = v.RegistrationPlate,
                    MakeModel         = $"{v.Make} {v.Model}",
                    Status            = v.Status.ToString(),
                    HasDriver         = v.DriverId != null,
                    HasConductor      = v.ConductorId != null,
                })
                .ToListAsync();
        }

        // ── UPDATE ────────────────────────────────────────────────────────────

        public async Task<VehicleResponse> UpdateVehicleAsync(
            Guid vehicleId, UpdateVehicleRequest request, Guid managerId, string managerRole)
        {
            var vehicle = await _context.Vehicles.FindAsync(vehicleId);
            if (vehicle == null) throw new Exception("Vehicle not found.");

            await AssertSaccoAccessAsync(vehicle, managerId, managerRole);

            var duplicate = await _context.Vehicles
                .AnyAsync(v => v.RegistrationPlate.ToUpper() == request.RegistrationPlate.ToUpper().Trim()
                            && v.Id != vehicleId);
            if (duplicate)
                throw new Exception($"Plate '{request.RegistrationPlate}' is already registered.");

            vehicle.RegistrationPlate = request.RegistrationPlate.ToUpper().Trim();
            vehicle.Make     = request.Make.Trim();
            vehicle.Model    = request.Model.Trim();
            vehicle.Year     = request.Year;
            vehicle.Capacity = request.Capacity;
            vehicle.Color    = request.Color.Trim();
            vehicle.Notes    = request.Notes?.Trim();
            vehicle.IsActive = request.IsActive;
            vehicle.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetVehicleByIdInternalAsync(vehicleId);
        }

        // ── ASSIGN CREW ───────────────────────────────────────────────────────

        public async Task<VehicleResponse> AssignCrewAsync(
            Guid vehicleId, AssignCrewRequest request, Guid managerId)
        {
            var vehicle = await _context.Vehicles.FindAsync(vehicleId);
            if (vehicle == null) throw new Exception("Vehicle not found.");

            await AssertSaccoAccessAsync(vehicle, managerId, "manager");

            if (request.DriverId.HasValue)
            {
                await ValidateCrewMemberAsync(request.DriverId.Value, vehicle.SaccoId, "driver");
                vehicle.DriverId = request.DriverId;
            }
            else
            {
                vehicle.DriverId = null;
            }

            if (request.ConductorId.HasValue)
            {
                await ValidateCrewMemberAsync(request.ConductorId.Value, vehicle.SaccoId, "conductor");
                vehicle.ConductorId = request.ConductorId;
            }
            else
            {
                vehicle.ConductorId = null;
            }

            vehicle.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return await GetVehicleByIdInternalAsync(vehicleId);
        }

        // ── ASSIGN ROUTE ──────────────────────────────────────────────────────

        public async Task<VehicleResponse> AssignRouteAsync(
            Guid vehicleId, AssignRouteRequest request, Guid managerId)
        {
            var vehicle = await _context.Vehicles.FindAsync(vehicleId);
            if (vehicle == null) throw new Exception("Vehicle not found.");

            await AssertSaccoAccessAsync(vehicle, managerId, "manager");

            if (request.RouteId.HasValue)
            {
                var route = await _context.Routes.FindAsync(request.RouteId.Value);
                if (route == null || !route.IsActive)
                    throw new Exception("Route not found or inactive.");
                vehicle.RouteId = request.RouteId;
            }
            else
            {
                vehicle.RouteId = null;
            }

            vehicle.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return await GetVehicleByIdInternalAsync(vehicleId);
        }

        // ── UPDATE STATUS ─────────────────────────────────────────────────────

        public async Task<VehicleResponse> UpdateStatusAsync(
            Guid vehicleId, UpdateVehicleStatusRequest request, Guid managerId, string managerRole)
        {
            var vehicle = await _context.Vehicles.FindAsync(vehicleId);
            if (vehicle == null) throw new Exception("Vehicle not found.");

            await AssertSaccoAccessAsync(vehicle, managerId, managerRole);

            vehicle.Status = request.Status;
            if (!string.IsNullOrWhiteSpace(request.Notes))
                vehicle.Notes = request.Notes.Trim();
            vehicle.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetVehicleByIdInternalAsync(vehicleId);
        }

        // ── DELETE ────────────────────────────────────────────────────────────

        public async Task<bool> DeleteVehicleAsync(Guid vehicleId, Guid managerId, string managerRole)
        {
            var vehicle = await _context.Vehicles
                .Include(v => v.Trips)
                .FirstOrDefaultAsync(v => v.Id == vehicleId);
            if (vehicle == null) throw new Exception("Vehicle not found.");

            await AssertSaccoAccessAsync(vehicle, managerId, managerRole);

            if (vehicle.Trips.Any())
                throw new Exception("Cannot delete a vehicle with trip records. Deactivate it instead.");

            _context.Vehicles.Remove(vehicle);
            await _context.SaveChangesAsync();
            return true;
        }

        // ── PRIVATE HELPERS ───────────────────────────────────────────────────

        private async Task<VehicleResponse> GetVehicleByIdInternalAsync(Guid vehicleId)
        {
            var v = await _context.Vehicles
                .Include(x => x.Sacco)
                .Include(x => x.Route)
                .Include(x => x.Driver)
                .Include(x => x.Conductor)
                .FirstOrDefaultAsync(x => x.Id == vehicleId);

            if (v == null) throw new Exception("Vehicle not found.");
            return MapToResponse(v);
        }

        private async Task ValidateCrewMemberAsync(Guid userId, Guid saccoId, string expectedRole)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)        throw new Exception("User not found.");
            if (user.Role != expectedRole)
                throw new Exception($"User is not a {expectedRole}.");
            if (user.SaccoId != saccoId)
                throw new Exception($"This {expectedRole} does not belong to your SACCO.");
            if (!user.IsActive)
                throw new Exception($"This {expectedRole} account is inactive.");
        }

        private async Task AssertSaccoAccessAsync(Vehicle vehicle, Guid userId, string role)
        {
            if (role == "admin") return;
            var saccoId = await GetManagerSaccoIdAsync(userId);
            if (vehicle.SaccoId != saccoId)
                throw new UnauthorizedAccessException("You can only manage vehicles in your SACCO.");
        }

        private async Task<Guid> GetManagerSaccoIdAsync(Guid managerId)
        {
            var manager = await _context.Users.FindAsync(managerId);
            if (manager?.SaccoId == null)
                throw new Exception("You are not assigned to a SACCO.");
            return manager.SaccoId.Value;
        }

        // Single mapper — used by both instance and ManagerService
        public static VehicleResponse MapToResponse(Vehicle v) => new()
        {
            Id                = v.Id,
            RegistrationPlate = v.RegistrationPlate,
            Make              = v.Make,
            Model             = v.Model,
            Year              = v.Year,
            Capacity          = v.Capacity,
            Color             = v.Color,
            Status            = v.Status.ToString(),
            IsActive          = v.IsActive,
            SaccoId           = v.SaccoId,
            SaccoName         = v.Sacco?.Name,
            RouteId           = v.RouteId,
            RouteName         = v.Route?.Name,
            RouteCode         = v.Route?.RouteCode,
            DriverId          = v.DriverId,
            DriverName        = v.Driver != null ? $"{v.Driver.FirstName} {v.Driver.LastName}" : null,
            DriverPhone       = v.Driver?.PhoneNumber,
            ConductorId       = v.ConductorId,
            ConductorName     = v.Conductor != null ? $"{v.Conductor.FirstName} {v.Conductor.LastName}" : null,
            ConductorPhone    = v.Conductor?.PhoneNumber,
            LastServiceDate   = v.LastServiceDate,
            NextServiceDate   = v.NextServiceDate,
            Mileage           = v.Mileage,
            MaintenanceDue    = v.NextServiceDate.HasValue
                                && v.NextServiceDate.Value <= DateTime.UtcNow.AddDays(7),
            Notes             = v.Notes,
            CreatedAt         = v.CreatedAt,
            UpdatedAt         = v.UpdatedAt,
        };
    }
}