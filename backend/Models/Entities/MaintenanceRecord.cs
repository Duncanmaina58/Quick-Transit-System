using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuickTransit.API.Models.Entities
{
    public class MaintenanceRecord
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid VehicleId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Type { get; set; } = string.Empty; // routine, repair, emergency

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        public decimal Cost { get; set; }
        public DateTime MaintenanceDate { get; set; }
        public DateTime? NextMaintenanceDate { get; set; }

        [MaxLength(100)]
        public string ServiceProvider { get; set; } = string.Empty;

        [MaxLength(20)]
        public string OdometerReading { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("VehicleId")]
        public virtual Vehicle Vehicle { get; set; }
    }
}