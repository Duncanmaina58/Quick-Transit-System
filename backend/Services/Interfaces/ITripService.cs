using QuickTransit.API.Models.DTOs;

namespace QuickTransit.API.Services.Interfaces
{
    public interface ITripService
    {
        // Driver actions
        Task<DriverTripContextResponse> GetDriverContextAsync(Guid driverId);
        Task<TripResponse> StartTripAsync(StartTripRequest request, Guid driverId);
        Task<TripResponse> EndTripAsync(Guid tripId, EndTripRequest request, Guid driverId);
        Task<TripResponse> CancelTripAsync(Guid tripId, string reason, Guid driverId);

        // Conductor actions
        Task<TripResponse> LogPassengersAsync(Guid tripId, LogPassengerRequest request, Guid conductorId);

        // Manager / Admin queries
        Task<TripResponse> GetTripByIdAsync(Guid tripId, Guid requesterId, string role);
        Task<PagedResponse<TripSummaryResponse>> GetTripsAsync(TripFilterRequest filter, Guid requesterId, string role);

        // Admin extras
        Task<PagedResponse<TripSummaryResponse>> GetAllTripsAsync(TripFilterRequest filter);
    }
}