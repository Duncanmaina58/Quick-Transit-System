using QuickTransit.API.Models.DTOs;

namespace QuickTransit.API.Services.Interfaces
{
    public interface ISaccoService
    {
        Task<SaccoResponse> CreateSaccoAsync(CreateSaccoRequest request, Guid createdById);
        Task<SaccoResponse> GetSaccoByIdAsync(Guid saccoId);
        Task<PagedResponse<SaccoResponse>> GetAllSaccosAsync(SaccoFilterRequest filter);
        Task<List<SaccoSummaryResponse>> GetSaccoSummariesAsync(); // for dropdowns
        Task<SaccoResponse> UpdateSaccoAsync(Guid saccoId, UpdateSaccoRequest request, Guid updatedById);
        Task<SaccoResponse> AssignManagerAsync(Guid saccoId, Guid managerId, Guid assignedById);
        Task<SaccoResponse> RemoveManagerAsync(Guid saccoId, Guid removedById);
        Task<bool> ActivateSaccoAsync(Guid saccoId, bool isActive, Guid updatedById);
        Task<bool> DeleteSaccoAsync(Guid saccoId, Guid deletedById);
    }
}