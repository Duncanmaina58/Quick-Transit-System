using QuickTransit.API.Models.Entities;

namespace QuickTransit.API.Models.DTOs
{
    // ── Requests ──────────────────────────────────────────────────────────────

    public class StartTripRequest
    {
        public Guid VehicleId { get; set; }
        public Guid RouteId { get; set; }
        public Guid? ConductorId { get; set; }         // optional override
        public int? InitialPassengerCount { get; set; }
        public string? Notes { get; set; }
    }

    public class EndTripRequest
    {
        public int FinalPassengerCount { get; set; }
        public string? Notes { get; set; }
    }

    public class LogPassengerRequest
    {
        public int PassengerCount { get; set; }
        public string? StopName { get; set; }
        public PassengerLogType LogType { get; set; } = PassengerLogType.Boarding;
    }

    public class TripFilterRequest
    {
        public Guid? SaccoId { get; set; }
        public Guid? VehicleId { get; set; }
        public Guid? DriverId { get; set; }
        public Guid? RouteId { get; set; }
        public string? Status { get; set; }             // Scheduled|InProgress|Completed|Cancelled
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    // ── Responses ─────────────────────────────────────────────────────────────

    public class TripResponse
    {
        public Guid Id { get; set; }

        // Vehicle
        public Guid VehicleId { get; set; }
        public string RegistrationPlate { get; set; } = string.Empty;
        public string VehicleMakeModel { get; set; } = string.Empty;

        // Route
        public Guid RouteId { get; set; }
        public string RouteName { get; set; } = string.Empty;
        public string RouteCode { get; set; } = string.Empty;
        public string Origin { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;

        // Crew
        public Guid DriverId { get; set; }
        public string DriverName { get; set; } = string.Empty;
        public string DriverEmployeeId { get; set; } = string.Empty;
        public Guid? ConductorId { get; set; }
        public string? ConductorName { get; set; }

        // SACCO
        public Guid SaccoId { get; set; }
        public string SaccoName { get; set; } = string.Empty;

        // Trip info
        public string Status { get; set; } = string.Empty;
        public DateTime? ScheduledStartTime { get; set; }
        public DateTime? ActualStartTime { get; set; }
        public DateTime? ActualEndTime { get; set; }
        public int? InitialPassengerCount { get; set; }
        public int? FinalPassengerCount { get; set; }
        public int? PeakPassengerCount { get; set; }
        public double? DurationMinutes { get; set; }
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; }
        public List<PassengerLogResponse> PassengerLogs { get; set; } = new();
    }

    public class PassengerLogResponse
    {
        public Guid Id { get; set; }
        public int PassengerCount { get; set; }
        public string? StopName { get; set; }
        public string LogType { get; set; } = string.Empty;
        public DateTime LogTime { get; set; }
    }

    public class TripSummaryResponse  // lightweight for lists
    {
        public Guid Id { get; set; }
        public string RegistrationPlate { get; set; } = string.Empty;
        public string RouteCode { get; set; } = string.Empty;
        public string RouteName { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? ActualStartTime { get; set; }
        public DateTime? ActualEndTime { get; set; }
        public int? FinalPassengerCount { get; set; }
        public double? DurationMinutes { get; set; }
        public string SaccoName { get; set; } = string.Empty;
    }

    public class DriverTripContextResponse  // what driver sees on their dashboard
    {
        public bool HasActiveTrip { get; set; }
        public TripResponse? ActiveTrip { get; set; }
        public string? AssignedVehiclePlate { get; set; }
        public Guid? AssignedVehicleId { get; set; }
        public string? AssignedRouteName { get; set; }
        public string? AssignedRouteCode { get; set; }
        public Guid? AssignedRouteId { get; set; }
        public bool CanStartTrip { get; set; }   // has vehicle + route assigned
    }
}