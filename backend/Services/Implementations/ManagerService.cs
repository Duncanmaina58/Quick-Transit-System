using Microsoft.EntityFrameworkCore;
using QuickTransit.API.Data;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Models.Entities;
using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Services.Implementations
{
    public class ManagerService : IManagerService
    {
        private readonly ApplicationDbContext _context;

        public ManagerService(ApplicationDbContext context) => _context = context;

        public async Task<ManagerDashboardResponse> GetDashboardAsync(Guid managerId)
        {
            var manager = await _context.Users
                .Include(u => u.Sacco)
                .FirstOrDefaultAsync(u => u.Id == managerId);

            if (manager?.SaccoId == null)
                throw new Exception("Manager is not assigned to a SACCO.");

            var saccoId = manager.SaccoId.Value;

            // Load vehicles with their navigations
            var vehicles = await _context.Vehicles
                .Include(v => v.Route)
                .Include(v => v.Driver)
                .Include(v => v.Conductor)
                .Where(v => v.SaccoId == saccoId)
                .ToListAsync();

            // Load crew (drivers + conductors only)
            var crew = await _context.Users
                .Where(u => u.SaccoId == saccoId
                         && (u.Role == "driver" || u.Role == "conductor")
                         && u.IsActive)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            // Trips today — join through Vehicle to scope to this SACCO
            var today = DateTime.UtcNow.Date;
            var tripsToday = await _context.Trips
                .Where(t => t.Vehicle.SaccoId == saccoId
                         && t.ActualStartTime.HasValue
                         && t.ActualStartTime.Value.Date == today)
                .CountAsync();

            // Violations this month — use Alerts with violation-type
            var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var violationsThisMonth = await _context.Alerts
                .Where(a => a.Vehicle.SaccoId == saccoId
                         && a.CreatedAt >= monthStart)
                .CountAsync();

            var recentVehicles = vehicles
                .OrderByDescending(v => v.CreatedAt)
                .Take(5)
                .Select(VehicleService.MapToResponse)
                .ToList();

            var recentCrew = crew
                .Take(5)
                .Select(u => new UserResponse
                {
                    Id                  = u.Id,
                    EmployeeId          = u.EmployeeId,
                    FirstName           = u.FirstName,
                    LastName            = u.LastName,
                    Email               = u.Email,
                    PhoneNumber         = u.PhoneNumber,
                    Role                = u.Role,
                    SaccoId             = u.SaccoId,
                    SaccoName           = manager.Sacco!.Name,
                    IsActive            = u.IsActive,
                    ForcePasswordChange = u.ForcePasswordChange,
                    CreatedAt           = u.CreatedAt,
                    LastLoginAt         = u.LastLoginAt,
                })
                .ToList();

            return new ManagerDashboardResponse
            {
                SaccoName           = manager.Sacco!.Name,
                RegistrationNumber  = manager.Sacco.RegistrationNumber,
                TotalVehicles       = vehicles.Count,
                ActiveVehicles      = vehicles.Count(v => v.Status == VehicleStatus.Active),
                VehiclesOnMaintenance = vehicles.Count(v => v.Status == VehicleStatus.Maintenance),
                MaintenanceDue      = vehicles.Count(v =>
                    v.NextServiceDate.HasValue
                    && v.NextServiceDate.Value <= DateTime.UtcNow.AddDays(7)),
                TotalDrivers        = crew.Count(u => u.Role == "driver"),
                TotalConductors     = crew.Count(u => u.Role == "conductor"),
                UnassignedDrivers   = crew.Count(u =>
                    u.Role == "driver"
                    && !vehicles.Any(v => v.DriverId == u.Id)),
                UnassignedConductors = crew.Count(u =>
                    u.Role == "conductor"
                    && !vehicles.Any(v => v.ConductorId == u.Id)),
                TotalRoutes         = await _context.Routes.CountAsync(r => r.IsActive),
                TripsToday          = tripsToday,
                ViolationsThisMonth = violationsThisMonth,
                RecentVehicles      = recentVehicles,
                RecentCrew          = recentCrew,
            };
        }
    }
}