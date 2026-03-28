namespace QuickTransit.API.Models.DTOs
{
    public class ManagerDashboardResponse
    {
        public string SaccoName { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;

        // Counts
        public int TotalVehicles { get; set; }
        public int ActiveVehicles { get; set; }
        public int VehiclesOnMaintenance { get; set; }
        public int TotalDrivers { get; set; }
        public int TotalConductors { get; set; }
        public int UnassignedDrivers { get; set; }
        public int UnassignedConductors { get; set; }
        public int TotalRoutes { get; set; }
        public int TripsToday { get; set; }
        public int ViolationsThisMonth { get; set; }
        public int MaintenanceDue { get; set; }    // vehicles overdue for service

        // Quick lists for dashboard widgets
        public List<VehicleResponse> RecentVehicles { get; set; } = new();
        public List<UserResponse> RecentCrew { get; set; } = new();
    }
}