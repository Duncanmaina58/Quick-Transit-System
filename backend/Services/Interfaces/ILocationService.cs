using QuickTransit.API.Models.DTOs;

namespace QuickTransit.API.Services.Interfaces
{
    public interface ILocationService
    {
        Task PostLocationAsync(Guid tripId, PostLocationRequest request, Guid driverId);
        Task<List<VehicleLocationResponse>> GetActiveVehicleLocationsAsync(Guid managerId);
        Task<List<TripLocationPointResponse>> GetTripPathAsync(Guid tripId);
        Task<VehicleLocationResponse?> GetVehicleLocationAsync(Guid tripId);
    }
}