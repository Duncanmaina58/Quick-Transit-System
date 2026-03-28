using Microsoft.EntityFrameworkCore;
using QuickTransit.API.Data;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Models.Entities;
using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Services.Implementations
{
    public class SaccoService : ISaccoService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SaccoService> _logger;

        public SaccoService(ApplicationDbContext context, ILogger<SaccoService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ── CREATE ────────────────────────────────────────────────────────────

        public async Task<SaccoResponse> CreateSaccoAsync(CreateSaccoRequest request, Guid createdById)
        {
            // Duplicate registration number check
            var exists = await _context.Saccos
                .AnyAsync(s => s.RegistrationNumber == request.RegistrationNumber.Trim().ToUpper());
            if (exists)
                throw new Exception($"A SACCO with registration number '{request.RegistrationNumber}' already exists.");

            // Validate manager if provided
            if (request.ManagerId.HasValue)
                await ValidateManagerAsync(request.ManagerId.Value);

            var sacco = new Sacco
            {
                Id = Guid.NewGuid(),
                Name = request.Name.Trim(),
                RegistrationNumber = request.RegistrationNumber.Trim().ToUpper(),
                Address = request.Address.Trim(),
                County = request.County.Trim(),
                ContactPhone = request.ContactPhone.Trim(),
                ContactEmail = request.ContactEmail.Trim().ToLower(),
                Description = request.Description?.Trim(),
                ManagerId = request.ManagerId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedById = createdById
            };

            _context.Saccos.Add(sacco);

            // If a manager is assigned, link the manager's SaccoId too
            if (request.ManagerId.HasValue)
                await LinkManagerToSaccoAsync(request.ManagerId.Value, sacco.Id);

            await _context.SaveChangesAsync();

            return await GetSaccoByIdAsync(sacco.Id);
        }

        // ── GET BY ID ─────────────────────────────────────────────────────────

        public async Task<SaccoResponse> GetSaccoByIdAsync(Guid saccoId)
        {
            var sacco = await _context.Saccos
                .Include(s => s.Manager)
                .Include(s => s.Users)
                .Include(s => s.Vehicles)
                .FirstOrDefaultAsync(s => s.Id == saccoId);

            if (sacco == null) throw new Exception("SACCO not found.");
            return MapToResponse(sacco);
        }

        // ── GET ALL (paged + filtered) ────────────────────────────────────────

        public async Task<PagedResponse<SaccoResponse>> GetAllSaccosAsync(SaccoFilterRequest filter)
        {
            var query = _context.Saccos
                .Include(s => s.Manager)
                .Include(s => s.Users)
                .Include(s => s.Vehicles)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var s = filter.Search.ToLower();
                query = query.Where(x =>
                    x.Name.ToLower().Contains(s) ||
                    x.RegistrationNumber.ToLower().Contains(s) ||
                    x.ContactEmail.ToLower().Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(filter.County))
                query = query.Where(x => x.County.ToLower() == filter.County.ToLower());

            if (filter.IsActive.HasValue)
                query = query.Where(x => x.IsActive == filter.IsActive);

            if (filter.HasManager.HasValue)
                query = filter.HasManager.Value
                    ? query.Where(x => x.ManagerId != null)
                    : query.Where(x => x.ManagerId == null);

            var total = await query.CountAsync();

            var saccos = await query
                .OrderByDescending(x => x.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResponse<SaccoResponse>
            {
                Data = saccos.Select(MapToResponse).ToList(),
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalCount = total
            };
        }

        // ── SUMMARIES (for dropdowns) ─────────────────────────────────────────

        public async Task<List<SaccoSummaryResponse>> GetSaccoSummariesAsync()
        {
            return await _context.Saccos
                .Include(s => s.Manager)
                .Where(s => s.IsActive)
                .OrderBy(s => s.Name)
                .Select(s => new SaccoSummaryResponse
                {
                    Id = s.Id,
                    Name = s.Name,
                    RegistrationNumber = s.RegistrationNumber,
                    IsActive = s.IsActive,
                    ManagerName = s.Manager != null
                        ? $"{s.Manager.FirstName} {s.Manager.LastName}"
                        : null
                })
                .ToListAsync();
        }

        // ── UPDATE ────────────────────────────────────────────────────────────

        public async Task<SaccoResponse> UpdateSaccoAsync(Guid saccoId, UpdateSaccoRequest request, Guid updatedById)
        {
            var sacco = await _context.Saccos.FindAsync(saccoId);
            if (sacco == null) throw new Exception("SACCO not found.");

            // Check reg number uniqueness (excluding self)
            var duplicate = await _context.Saccos
                .AnyAsync(s => s.RegistrationNumber == request.RegistrationNumber.Trim().ToUpper()
                               && s.Id != saccoId);
            if (duplicate)
                throw new Exception($"Registration number '{request.RegistrationNumber}' is already used by another SACCO.");

            sacco.Name = request.Name.Trim();
            sacco.RegistrationNumber = request.RegistrationNumber.Trim().ToUpper();
            sacco.Address = request.Address.Trim();
            sacco.County = request.County.Trim();
            sacco.ContactPhone = request.ContactPhone.Trim();
            sacco.ContactEmail = request.ContactEmail.Trim().ToLower();
            sacco.Description = request.Description?.Trim();
            sacco.IsActive = request.IsActive;
            sacco.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetSaccoByIdAsync(saccoId);
        }

        // ── ASSIGN MANAGER ────────────────────────────────────────────────────

        public async Task<SaccoResponse> AssignManagerAsync(Guid saccoId, Guid managerId, Guid assignedById)
        {
            var sacco = await _context.Saccos.FindAsync(saccoId);
            if (sacco == null) throw new Exception("SACCO not found.");

            await ValidateManagerAsync(managerId, saccoId);

            // If there was a previous manager, unlink them from this sacco
            if (sacco.ManagerId.HasValue && sacco.ManagerId != managerId)
            {
                var prevManager = await _context.Users.FindAsync(sacco.ManagerId.Value);
                if (prevManager?.SaccoId == saccoId)
                {
                    prevManager.SaccoId = null;
                    prevManager.UpdatedAt = DateTime.UtcNow;
                }
            }

            // Assign new manager
            sacco.ManagerId = managerId;
            sacco.UpdatedAt = DateTime.UtcNow;

            await LinkManagerToSaccoAsync(managerId, saccoId);
            await _context.SaveChangesAsync();

            return await GetSaccoByIdAsync(saccoId);
        }

        // ── REMOVE MANAGER ────────────────────────────────────────────────────

        public async Task<SaccoResponse> RemoveManagerAsync(Guid saccoId, Guid removedById)
        {
            var sacco = await _context.Saccos.FindAsync(saccoId);
            if (sacco == null) throw new Exception("SACCO not found.");

            if (!sacco.ManagerId.HasValue)
                throw new Exception("This SACCO does not have an assigned manager.");

            // Unlink manager's SaccoId
            var manager = await _context.Users.FindAsync(sacco.ManagerId.Value);
            if (manager != null)
            {
                manager.SaccoId = null;
                manager.UpdatedAt = DateTime.UtcNow;
            }

            sacco.ManagerId = null;
            sacco.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetSaccoByIdAsync(saccoId);
        }

        // ── ACTIVATE / DEACTIVATE ─────────────────────────────────────────────

        public async Task<bool> ActivateSaccoAsync(Guid saccoId, bool isActive, Guid updatedById)
        {
            var sacco = await _context.Saccos.FindAsync(saccoId);
            if (sacco == null) throw new Exception("SACCO not found.");

            sacco.IsActive = isActive;
            sacco.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        // ── DELETE ────────────────────────────────────────────────────────────

        public async Task<bool> DeleteSaccoAsync(Guid saccoId, Guid deletedById)
        {
            var sacco = await _context.Saccos
                .Include(s => s.Users)
                .Include(s => s.Vehicles)
                .FirstOrDefaultAsync(s => s.Id == saccoId);

            if (sacco == null) throw new Exception("SACCO not found.");

            // Safety check — don't hard-delete if it has users or vehicles
            if (sacco.Users.Any())
                throw new Exception("Cannot delete a SACCO that has users assigned. Deactivate it instead.");
            if (sacco.Vehicles.Any())
                throw new Exception("Cannot delete a SACCO that has vehicles assigned. Deactivate it instead.");

            _context.Saccos.Remove(sacco);
            await _context.SaveChangesAsync();
            return true;
        }

        // ── PRIVATE HELPERS ───────────────────────────────────────────────────

        private async Task ValidateManagerAsync(Guid managerId, Guid? targetSaccoId = null)
        {
            var manager = await _context.Users.FindAsync(managerId);
            if (manager == null)
                throw new Exception("Manager user not found.");
            if (manager.Role != "manager")
                throw new Exception($"User '{manager.FirstName} {manager.LastName}' does not have the manager role.");
            if (!manager.IsActive)
                throw new Exception($"User '{manager.FirstName} {manager.LastName}' is not active.");

            // Check if this manager is already assigned to a DIFFERENT sacco
            var alreadyManages = await _context.Saccos
                .AnyAsync(s => s.ManagerId == managerId && s.Id != targetSaccoId);
            if (alreadyManages)
                throw new Exception("This user is already managing another SACCO.");
        }

        private async Task LinkManagerToSaccoAsync(Guid managerId, Guid saccoId)
        {
            var manager = await _context.Users.FindAsync(managerId);
            if (manager != null)
            {
                manager.SaccoId = saccoId;
                manager.UpdatedAt = DateTime.UtcNow;
            }
        }

        private static SaccoResponse MapToResponse(Sacco sacco) => new()
        {
            Id = sacco.Id,
            Name = sacco.Name,
            RegistrationNumber = sacco.RegistrationNumber,
            Address = sacco.Address,
            County = sacco.County,
            ContactPhone = sacco.ContactPhone,
            ContactEmail = sacco.ContactEmail,
            Description = sacco.Description,
            IsActive = sacco.IsActive,
            ManagerId = sacco.ManagerId,
            ManagerName = sacco.Manager != null
                ? $"{sacco.Manager.FirstName} {sacco.Manager.LastName}"
                : null,
            ManagerEmail = sacco.Manager?.Email,
            ManagerPhone = sacco.Manager?.PhoneNumber,
            TotalVehicles = sacco.Vehicles?.Count ?? 0,
            TotalCrew = sacco.Users?.Count(u => u.Role is "driver" or "conductor") ?? 0,
            CreatedAt = sacco.CreatedAt,
            UpdatedAt = sacco.UpdatedAt
        };
    }
}