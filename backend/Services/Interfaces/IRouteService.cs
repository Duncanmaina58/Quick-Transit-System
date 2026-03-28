using QuickTransit.API.Models.DTOs;

namespace QuickTransit.API.Services.Interfaces
{
    public interface IRouteService
    {
        Task<RouteResponse> GetRouteByIdAsync(Guid routeId);
        Task<PagedResponse<RouteResponse>> GetRoutesAsync(RouteFilterRequest filter);
        Task<List<RouteSummaryResponse>> GetRouteSummariesAsync(); // for dropdowns

        // Admin only
        Task<RouteResponse> CreateRouteAsync(CreateRouteRequest request, Guid adminId);
        Task<RouteResponse> UpdateRouteAsync(Guid routeId, UpdateRouteRequest request, Guid adminId);
        Task<bool> ActivateRouteAsync(Guid routeId, bool isActive, Guid adminId);
        Task<bool> DeleteRouteAsync(Guid routeId, Guid adminId);
    }
}