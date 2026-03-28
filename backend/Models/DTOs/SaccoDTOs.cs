namespace QuickTransit.API.Models.DTOs
{
    // ── Requests ──────────────────────────────────────────────────────────────

    public class CreateSaccoRequest
    {
        public string Name { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string County { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid? ManagerId { get; set; }  // optionally assign manager at creation
    }

    public class UpdateSaccoRequest
    {
        public string Name { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string County { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class AssignManagerRequest
    {
        public Guid ManagerId { get; set; }
    }

    public class SaccoFilterRequest
    {
        public string? Search { get; set; }       // name or reg number
        public string? County { get; set; }
        public bool? IsActive { get; set; }
        public bool? HasManager { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    // ── Responses ─────────────────────────────────────────────────────────────

    public class SaccoResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string County { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public Guid? ManagerId { get; set; }
        public string? ManagerName { get; set; }
        public string? ManagerEmail { get; set; }
        public string? ManagerPhone { get; set; }
        public int TotalVehicles { get; set; }
        public int TotalCrew { get; set; }         // drivers + conductors
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class SaccoSummaryResponse  // lightweight for dropdowns
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public string? ManagerName { get; set; }
    }
}