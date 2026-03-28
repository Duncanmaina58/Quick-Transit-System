// VehicleDTOs.cs — add at the top
using QuickTransit.API.Models.Entities;
namespace QuickTransit.API.Models.DTOs
{
    public class CreateVehicleRequest
    {
        public string RegistrationPlate { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public int Capacity { get; set; } = 14;
        public string Color { get; set; } = string.Empty;
        public Guid? RouteId { get; set; }
        public Guid? DriverId { get; set; }
        public Guid? ConductorId { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateVehicleRequest
    {
        public string RegistrationPlate { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public int Capacity { get; set; }
        public string Color { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class AssignCrewRequest
    {
        public Guid? DriverId { get; set; }
        public Guid? ConductorId { get; set; }
    }

    public class AssignRouteRequest
    {
        public Guid? RouteId { get; set; } // null = unassign
    }

    public class UpdateVehicleStatusRequest
    {
        public VehicleStatus Status { get; set; }
        public string? Notes { get; set; }
    }

    public class VehicleFilterRequest
    {
        public string? Search { get; set; }       // plate, make, model
        public Guid? SaccoId { get; set; }        // admin only
        public Guid? RouteId { get; set; }
        public string? Status { get; set; }        // "active","maintenance","inactive","suspended"
        public bool? HasDriver { get; set; }
        public bool? HasConductor { get; set; }
        public bool? IsActive { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class VehicleResponse
    {
        public Guid Id { get; set; }
        public string RegistrationPlate { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public int Capacity { get; set; }
        public string Color { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool IsActive { get; set; }

        // SACCO
        public Guid SaccoId { get; set; }
        public string? SaccoName { get; set; }

        // Route
        public Guid? RouteId { get; set; }
        public string? RouteName { get; set; }
        public string? RouteCode { get; set; }

        // Crew
        public Guid? DriverId { get; set; }
        public string? DriverName { get; set; }
        public string? DriverPhone { get; set; }
        public Guid? ConductorId { get; set; }
        public string? ConductorName { get; set; }
        public string? ConductorPhone { get; set; }

        // Maintenance
        public DateTime? LastServiceDate { get; set; }
        public DateTime? NextServiceDate { get; set; }
        public int? Mileage { get; set; }
        public bool MaintenanceDue { get; set; }

        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class VehicleSummaryResponse // for dropdowns
    {
        public Guid Id { get; set; }
        public string RegistrationPlate { get; set; } = string.Empty;
        public string MakeModel { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool HasDriver { get; set; }
        public bool HasConductor { get; set; }
    }
}