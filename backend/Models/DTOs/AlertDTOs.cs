namespace QuickTransit.API.Models.DTOs
{
    public class CreateIncidentRequest
    {
        public string Type { get; set; } = string.Empty;     // Accident, Breakdown, PoliceStop, TrafficJam, Other
        public string Severity { get; set; } = "medium";
        public string Description { get; set; } = string.Empty;
        public Guid? VehicleId { get; set; }
        public Guid? TripId { get; set; }
    }

    public class AlertFilterRequest
    {
        public Guid? SaccoId { get; set; }
        public Guid? VehicleId { get; set; }
        public string? Status { get; set; }
        public string? Type { get; set; }
        public string? Severity { get; set; }
        public DateTime? DateFrom { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class AlertSummaryResponse
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? VehiclePlate { get; set; }
        public string? ReportedByName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public Guid? TripId { get; set; }
        public Guid? VehicleId { get; set; }
    }

    public class AcknowledgeAlertRequest
    {
        public string? Notes { get; set; }
    }

    // Live trip view (what driver sees including conductor's passenger updates)
    public class LiveTripResponse
    {
        public Guid TripId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string RegistrationPlate { get; set; } = string.Empty;
        public string RouteCode { get; set; } = string.Empty;
        public string RouteName { get; set; } = string.Empty;
        public string Origin { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public List<string> Stops { get; set; } = new();
        public string? ConductorName { get; set; }
        public DateTime? ActualStartTime { get; set; }
        public string ElapsedTime { get; set; } = string.Empty;
        public int CurrentPassengerCount { get; set; }
        public int VehicleCapacity { get; set; }
        public int? PeakPassengerCount { get; set; }
        public bool IsOverloaded { get; set; }
        public List<PassengerLogResponse> RecentLogs { get; set; } = new();
        public List<AlertSummaryResponse> ActiveAlerts { get; set; } = new();
    }
}