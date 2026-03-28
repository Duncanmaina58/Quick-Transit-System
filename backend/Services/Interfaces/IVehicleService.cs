using QuickTransit.API.Models.DTOs;

namespace QuickTransit.API.Services.Interfaces
{
    public interface IVehicleService
    {
        // Both admin + manager
        Task<VehicleResponse> GetVehicleByIdAsync(Guid vehicleId, Guid requesterId, string requesterRole);
        Task<PagedResponse<VehicleResponse>> GetVehiclesAsync(VehicleFilterRequest filter, Guid requesterId, string requesterRole);
        Task<List<VehicleSummaryResponse>> GetVehicleSummariesAsync(Guid saccoId); // for dropdowns

        // Manager (scoped to their SACCO)
        Task<VehicleResponse> CreateVehicleAsync(CreateVehicleRequest request, Guid managerId);
        Task<VehicleResponse> UpdateVehicleAsync(Guid vehicleId, UpdateVehicleRequest request, Guid managerId, string managerRole);
        Task<VehicleResponse> AssignCrewAsync(Guid vehicleId, AssignCrewRequest request, Guid managerId);
        Task<VehicleResponse> AssignRouteAsync(Guid vehicleId, AssignRouteRequest request, Guid managerId);
        Task<VehicleResponse> UpdateStatusAsync(Guid vehicleId, UpdateVehicleStatusRequest request, Guid managerId, string managerRole);
        Task<bool> DeleteVehicleAsync(Guid vehicleId, Guid managerId, string managerRole);
    }
}