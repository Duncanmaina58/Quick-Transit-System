namespace QuickTransit.API.Models.DTOs
{
    public class CreateRouteRequest
    {
        public string Name { get; set; } = string.Empty;
        public string RouteCode { get; set; } = string.Empty;
        public string Origin { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Stops { get; set; }        // JSON string
        public double? DistanceKm { get; set; }
        public int? EstimatedMinutes { get; set; }
    }

    public class UpdateRouteRequest
    {
        public string Name { get; set; } = string.Empty;
        public string RouteCode { get; set; } = string.Empty;
        public string Origin { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Stops { get; set; }
        public double? DistanceKm { get; set; }
        public int? EstimatedMinutes { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class RouteFilterRequest
    {
        public string? Search { get; set; }
        public bool? IsActive { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class RouteResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RouteCode { get; set; } = string.Empty;
        public string Origin { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Stops { get; set; }
        public double? DistanceKm { get; set; }
        public int? EstimatedMinutes { get; set; }
        public bool IsActive { get; set; }
        public int TotalVehicles { get; set; } // vehicles currently on this route
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class RouteSummaryResponse // for dropdowns
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RouteCode { get; set; } = string.Empty;
        public string Origin { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}