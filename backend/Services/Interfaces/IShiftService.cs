using QuickTransit.API.Models.DTOs;

namespace QuickTransit.API.Services.Interfaces
{
    public interface IShiftService
    {
        Task<ShiftContextResponse> GetDriverShiftContextAsync(Guid driverId);
        Task<ShiftContextResponse> GetConductorShiftContextAsync(Guid conductorId);
    }
}