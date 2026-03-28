using Microsoft.EntityFrameworkCore;
using QuickTransit.API.Data;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Models.Entities;
using QuickTransit.API.Services.Interfaces;
// RouteService.cs — add at the top, use alias
using RouteEntity = QuickTransit.API.Models.Entities.Route;
namespace QuickTransit.API.Services.Implementations
{
    public class RouteService : IRouteService
    {
        private readonly ApplicationDbContext _context;

        public RouteService(ApplicationDbContext context) => _context = context;

        public async Task<RouteResponse> CreateRouteAsync(CreateRouteRequest request, Guid adminId)
        {
            var exists = await _context.Routes
                .AnyAsync(r => r.RouteCode.ToUpper() == request.RouteCode.ToUpper().Trim());
            if (exists)
                throw new Exception($"Route code '{request.RouteCode}' already exists.");

            var route = new RouteEntity
            {
                Id = Guid.NewGuid(),
                Name = request.Name.Trim(),
                RouteCode = request.RouteCode.ToUpper().Trim(),
                Origin = request.Origin.Trim(),
                Destination = request.Destination.Trim(),
                Description = request.Description?.Trim(),
                Stops = request.Stops,
                DistanceKm = request.DistanceKm,
                EstimatedMinutes = request.EstimatedMinutes,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedById = adminId,
            };

            _context.Routes.Add(route);
            await _context.SaveChangesAsync();
            return await GetRouteByIdAsync(route.Id);
        }

        public async Task<RouteResponse> GetRouteByIdAsync(Guid routeId)
        {
            var route = await _context.Routes
                // .Include(r => r.Vehicles)
                .FirstOrDefaultAsync(r => r.Id == routeId);

            if (route == null) throw new Exception("Route not found.");
            return MapToResponse(route);
        }

        public async Task<PagedResponse<RouteResponse>> GetRoutesAsync(RouteFilterRequest filter)
        {
            var query = _context.Routes.Include(r => r.Vehicles).AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var s = filter.Search.ToLower();
                query = query.Where(r =>
                    r.Name.ToLower().Contains(s) ||
                    r.RouteCode.ToLower().Contains(s) ||
                    r.Origin.ToLower().Contains(s) ||
                    r.Destination.ToLower().Contains(s));
            }

            if (filter.IsActive.HasValue)
                query = query.Where(r => r.IsActive == filter.IsActive);

            var total = await query.CountAsync();
            var routes = await query
                .OrderBy(r => r.RouteCode)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResponse<RouteResponse>
            {
                Data = routes.Select(MapToResponse).ToList(),
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalCount = total,
            };
        }

        public async Task<List<RouteSummaryResponse>> GetRouteSummariesAsync()
        {
            return await _context.Routes
                .Where(r => r.IsActive)
                .OrderBy(r => r.RouteCode)
                .Select(r => new RouteSummaryResponse
                {
                    Id = r.Id,
                    Name = r.Name,
                    RouteCode = r.RouteCode,
                    Origin = r.Origin,
                    Destination = r.Destination,
                    IsActive = r.IsActive,
                })
                .ToListAsync();
        }

        public async Task<RouteResponse> UpdateRouteAsync(Guid routeId, UpdateRouteRequest request, Guid adminId)
        {
            var route = await _context.Routes.FindAsync(routeId);
            if (route == null) throw new Exception("Route not found.");

            var duplicate = await _context.Routes
                .AnyAsync(r => r.RouteCode.ToUpper() == request.RouteCode.ToUpper().Trim() && r.Id != routeId);
            if (duplicate) throw new Exception($"Route code '{request.RouteCode}' already used.");

            route.Name = request.Name.Trim();
            route.RouteCode = request.RouteCode.ToUpper().Trim();
            route.Origin = request.Origin.Trim();
            route.Destination = request.Destination.Trim();
            route.Description = request.Description?.Trim();
            route.Stops = request.Stops;
            route.DistanceKm = request.DistanceKm;
            route.EstimatedMinutes = request.EstimatedMinutes;
            route.IsActive = request.IsActive;
            route.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetRouteByIdAsync(routeId);
        }

        public async Task<bool> ActivateRouteAsync(Guid routeId, bool isActive, Guid adminId)
        {
            var route = await _context.Routes.FindAsync(routeId);
            if (route == null) throw new Exception("Route not found.");
            route.IsActive = isActive;
            route.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteRouteAsync(Guid routeId, Guid adminId)
        {
            var route = await _context.Routes
                .Include(r => r.Vehicles)
                .FirstOrDefaultAsync(r => r.Id == routeId);
            if (route == null) throw new Exception("Route not found.");
            if (route.Vehicles.Any())
                throw new Exception("Cannot delete a route with assigned vehicles. Remove vehicle assignments first.");

            _context.Routes.Remove(route);
            await _context.SaveChangesAsync();
            return true;
        }

        private static RouteResponse MapToResponse(RouteEntity r) => new()
        {
            Id = r.Id,
            Name = r.Name,
            RouteCode = r.RouteCode,
            Origin = r.Origin,
            Destination = r.Destination,
            Description = r.Description,
            Stops = r.Stops,
            DistanceKm = r.DistanceKm,
            EstimatedMinutes = r.EstimatedMinutes,
            IsActive = r.IsActive,
            TotalVehicles = r.Vehicles?.Count ?? 0,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt,
        };
    }
}