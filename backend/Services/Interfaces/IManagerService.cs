using QuickTransit.API.Models.DTOs;

namespace QuickTransit.API.Services.Interfaces
{
    public interface IManagerService
    {
        Task<ManagerDashboardResponse> GetDashboardAsync(Guid managerId);
    }
}