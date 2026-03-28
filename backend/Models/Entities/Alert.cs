using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuickTransit.API.Models.Entities
{
    public class Alert
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string Type { get; set; } = string.Empty; // overloading, off_route, speeding, breakdown, emergency

        [Required]
        public string Severity { get; set; } = "medium"; // low, medium, high, critical

        [Required]
        public string Status { get; set; } = "active"; // active, acknowledged, resolved

        public Guid? TripId { get; set; }
        public Guid? VehicleId { get; set; }
        public Guid? ReportedById { get; set; }

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }

        public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? AcknowledgedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }

        // Navigation properties
        [ForeignKey("TripId")]
        public virtual Trip? Trip { get; set; }

        [ForeignKey("VehicleId")]
        public virtual Vehicle? Vehicle { get; set; }

        [ForeignKey("ReportedById")]
        public virtual User? ReportedBy { get; set; }
    }
}