using QuickTransit.API.Models.DTOs;

namespace QuickTransit.API.Services.Interfaces
{
    public interface IAlertService
    {
        Task<AlertSummaryResponse> CreateIncidentAsync(
            CreateIncidentRequest request, Guid reportedById);

        Task<PagedResponse<AlertSummaryResponse>> GetAlertsAsync(
            AlertFilterRequest filter, Guid requesterId, string role);

        Task<AlertSummaryResponse> AcknowledgeAlertAsync(
            Guid alertId, AcknowledgeAlertRequest request, Guid userId);

        Task<AlertSummaryResponse> ResolveAlertAsync(
            Guid alertId, string? notes, Guid userId);

        Task<LiveTripResponse?> GetLiveTripAsync(Guid tripId);
    }
}