using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuickTransit.API.Models.Entities
{
    public class Vehicle
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(20)]
        public string RegistrationPlate { get; set; } = string.Empty; // e.g. KCA 123A

        [Required]
        [MaxLength(50)]
        public string Make { get; set; } = string.Empty; // e.g. Toyota

        [Required]
        [MaxLength(50)]
        public string Model { get; set; } = string.Empty; // e.g. Hiace

        public int Year { get; set; }

        [Range(1, 100)]
        public int Capacity { get; set; } = 14; // passenger seats

        [MaxLength(30)]
        public string Color { get; set; } = string.Empty;

        public VehicleStatus Status { get; set; } = VehicleStatus.Active;

        // Assigned route
        public Guid? RouteId { get; set; }

        // SACCO this vehicle belongs to
        [Required]
        public Guid SaccoId { get; set; }

        // Currently assigned driver
        public Guid? DriverId { get; set; }

        // Currently assigned conductor
        public Guid? ConductorId { get; set; }

        // Maintenance tracking
        public DateTime? LastServiceDate { get; set; }
        public DateTime? NextServiceDate { get; set; }
        public int? Mileage { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public Guid? CreatedById { get; set; }

        // ── Navigation ───────────────────────────────────────────────────────
        [ForeignKey("SaccoId")]
        public virtual Sacco? Sacco { get; set; }

        [ForeignKey("RouteId")]
        public virtual Route? Route { get; set; }

        [ForeignKey("DriverId")]
        public virtual User? Driver { get; set; }

        [ForeignKey("ConductorId")]
        public virtual User? Conductor { get; set; }

        public virtual ICollection<Trip> Trips { get; set; } = new List<Trip>();
    }

    public enum VehicleStatus
    {
        Active      = 1,
        Maintenance = 2,
        Inactive    = 3,
        Suspended   = 4,
    }
}