using Microsoft.EntityFrameworkCore;
using QuickTransit.API.Data;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Models.Entities;
using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Services.Implementations
{
    public class AlertService : IAlertService
    {
        private readonly ApplicationDbContext _context;

        public AlertService(ApplicationDbContext context) => _context = context;

        public async Task<AlertSummaryResponse> CreateIncidentAsync(
            CreateIncidentRequest request, Guid reportedById)
        {
            var alert = new Alert
            {
                Id          = Guid.NewGuid(),
                Type        = request.Type,
                Severity    = request.Severity,
                Status      = "active",
                Description = request.Description.Trim(),
                VehicleId   = request.VehicleId,
                TripId      = request.TripId,
                ReportedById = reportedById,
                DetectedAt  = DateTime.UtcNow,
                CreatedAt   = DateTime.UtcNow,
            };

            _context.Alerts.Add(alert);
            await _context.SaveChangesAsync();

            return await GetAlertSummaryAsync(alert.Id);
        }

        public async Task<PagedResponse<AlertSummaryResponse>> GetAlertsAsync(
            AlertFilterRequest filter, Guid requesterId, string role)
        {
            var query = _context.Alerts
                .AsNoTracking()
                .Include(a => a.Vehicle).ThenInclude(v => v!.Sacco)
                .Include(a => a.ReportedBy)
                .AsQueryable();

            // Scope manager to their SACCO
            if (role == "manager")
            {
                var user = await _context.Users.FindAsync(requesterId);
                if (user?.SaccoId != null)
                    query = query.Where(a => a.Vehicle != null
                        && a.Vehicle.SaccoId == user.SaccoId);
            }
            else if (role == "driver" || role == "conductor")
            {
                // Crew see only alerts they reported or on their current trip
                query = query.Where(a => a.ReportedById == requesterId);
            }

            if (!string.IsNullOrWhiteSpace(filter.Status))
                query = query.Where(a => a.Status == filter.Status);

            if (!string.IsNullOrWhiteSpace(filter.Type))
                query = query.Where(a => a.Type == filter.Type);

            if (!string.IsNullOrWhiteSpace(filter.Severity))
                query = query.Where(a => a.Severity == filter.Severity);

            if (filter.VehicleId.HasValue)
                query = query.Where(a => a.VehicleId == filter.VehicleId);

            if (filter.DateFrom.HasValue)
                query = query.Where(a => a.CreatedAt >= filter.DateFrom);

            var total = await query.CountAsync();
            var alerts = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResponse<AlertSummaryResponse>
            {
                Data = alerts.Select(MapToSummary).ToList(),
                Page = filter.Page, PageSize = filter.PageSize, TotalCount = total,
            };
        }

        public async Task<AlertSummaryResponse> AcknowledgeAlertAsync(
            Guid alertId, AcknowledgeAlertRequest request, Guid userId)
        {
            var alert = await _context.Alerts.FindAsync(alertId)
                ?? throw new Exception("Alert not found.");

            alert.Status = "acknowledged";
            alert.AcknowledgedAt = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(request.Notes))
                alert.Description += $"\n[ACK] {request.Notes}";

            await _context.SaveChangesAsync();
            return await GetAlertSummaryAsync(alertId);
        }

        public async Task<AlertSummaryResponse> ResolveAlertAsync(
            Guid alertId, string? notes, Guid userId)
        {
            var alert = await _context.Alerts.FindAsync(alertId)
                ?? throw new Exception("Alert not found.");

            alert.Status = "resolved";
            alert.ResolvedAt = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(notes))
                alert.Description += $"\n[RESOLVED] {notes}";

            await _context.SaveChangesAsync();
            return await GetAlertSummaryAsync(alertId);
        }

        public async Task<LiveTripResponse?> GetLiveTripAsync(Guid tripId)
        {
            var trip = await _context.Trips
                .AsNoTracking()
                .Include(t => t.Vehicle).ThenInclude(v => v!.Sacco)
                .Include(t => t.Route)
                .Include(t => t.Driver)
                .Include(t => t.Conductor)
                .Include(t => t.PassengerLogs.OrderByDescending(pl => pl.LogTime).Take(5))
                .FirstOrDefaultAsync(t => t.Id == tripId && t.Status == TripStatus.InProgress);

            if (trip == null) return null;

            // Get current passenger count (latest log)
            var latestLog = await _context.PassengerLogs
                .AsNoTracking()
                .Where(pl => pl.TripId == tripId)
                .OrderByDescending(pl => pl.LogTime)
                .FirstOrDefaultAsync();

            var currentPax    = latestLog?.CurrentPassengerCount ?? trip.InitialPassengerCount ?? 0;
            var capacity      = trip.Vehicle?.Capacity ?? 14;
            var elapsed       = trip.ActualStartTime.HasValue
                ? FormatElapsed(DateTime.UtcNow - trip.ActualStartTime.Value)
                : "00:00:00";

            // Active alerts for this trip
            var activeAlerts = await _context.Alerts
                .AsNoTracking()
                .Include(a => a.ReportedBy)
                .Where(a => a.TripId == tripId && a.Status == "active")
                .OrderByDescending(a => a.CreatedAt)
                .Take(5)
                .ToListAsync();

            // Parse stops from route
            var stops = new List<string>();
            if (!string.IsNullOrWhiteSpace(trip.Route?.Stops))
            {
                try { stops = System.Text.Json.JsonSerializer.Deserialize<List<string>>(trip.Route.Stops) ?? new(); }
                catch { stops = trip.Route.Stops.Split(',').Select(s => s.Trim()).ToList(); }
            }

            return new LiveTripResponse
            {
                TripId                = trip.Id,
                Status                = trip.Status.ToString(),
                RegistrationPlate     = trip.Vehicle?.RegistrationPlate ?? string.Empty,
                RouteCode             = trip.Route?.RouteCode ?? string.Empty,
                RouteName             = trip.Route?.Name ?? string.Empty,
                Origin                = trip.Route?.Origin ?? string.Empty,
                Destination           = trip.Route?.Destination ?? string.Empty,
                Stops                 = stops,
                ConductorName         = trip.Conductor != null
                    ? $"{trip.Conductor.FirstName} {trip.Conductor.LastName}" : null,
                ActualStartTime       = trip.ActualStartTime,
                ElapsedTime           = elapsed,
                CurrentPassengerCount = currentPax,
                VehicleCapacity       = capacity,
                PeakPassengerCount    = trip.PeakPassengerCount,
                IsOverloaded          = currentPax > capacity,
                RecentLogs = trip.PassengerLogs.Select(pl => new PassengerLogResponse
                {
                    Id = pl.Id, PassengerCount = pl.PassengerCount,
                    StopName = pl.StopName, LogType = pl.LogType.ToString(),
                    LogTime = pl.LogTime,
                }).ToList(),
                ActiveAlerts = activeAlerts.Select(MapToSummary).ToList(),
            };
        }

        // ── Helpers ───────────────────────────────────────────────────────────
        private async Task<AlertSummaryResponse> GetAlertSummaryAsync(Guid id)
        {
            var a = await _context.Alerts
                .AsNoTracking()
                .Include(x => x.Vehicle)
                .Include(x => x.ReportedBy)
                .FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new Exception("Alert not found.");
            return MapToSummary(a);
        }

        private static AlertSummaryResponse MapToSummary(Alert a) => new()
        {
            Id             = a.Id,
            Type           = a.Type,
            Severity       = a.Severity,
            Status         = a.Status,
            Description    = a.Description,
            VehiclePlate   = a.Vehicle?.RegistrationPlate,
            ReportedByName = a.ReportedBy != null
                ? $"{a.ReportedBy.FirstName} {a.ReportedBy.LastName}" : null,
            CreatedAt   = a.CreatedAt,
            ResolvedAt  = a.ResolvedAt,
            TripId      = a.TripId,
            VehicleId   = a.VehicleId,
        };

        private static string FormatElapsed(TimeSpan ts) =>
            $"{(int)ts.TotalHours:00}:{ts.Minutes:00}:{ts.Seconds:00}";
    }
}