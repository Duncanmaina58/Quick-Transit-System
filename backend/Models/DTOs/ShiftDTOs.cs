namespace QuickTransit.API.Models.DTOs
{
    public class StartShiftRequest
    {
        public Guid VehicleId { get; set; }
        public Guid RouteId { get; set; }
    }

    public class ShiftContextResponse
    {
        public bool IsAssigned { get; set; }
        public string? AssignedVehiclePlate { get; set; }
        public Guid? AssignedVehicleId { get; set; }
        public int? VehicleCapacity { get; set; }
        public string? AssignedRouteName { get; set; }
        public string? AssignedRouteCode { get; set; }
        public string? AssignedRouteOrigin { get; set; }
        public string? AssignedRouteDestination { get; set; }
        public List<string> RouteStops { get; set; } = new();
        public Guid? AssignedRouteId { get; set; }
        public string? ConductorName { get; set; }
        public Guid? ConductorId { get; set; }
        public string? DriverName { get; set; }      // for conductor view
        public Guid? DriverId { get; set; }           // for conductor view
        public string? SaccoName { get; set; }
    }
}