using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuickTransit.API.Models.Entities
{
    public class Route
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty; // e.g. CBD - Westlands

        [Required]
        [MaxLength(20)]
        public string RouteCode { get; set; } = string.Empty; // e.g. NRB-01

        [MaxLength(100)]
        public string Origin { get; set; } = string.Empty; // e.g. Nairobi CBD

        [MaxLength(100)]
        public string Destination { get; set; } = string.Empty; // e.g. Westlands

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(500)]
        public string? Stops { get; set; } // JSON array of stop names

        public double? DistanceKm { get; set; }

        public int? EstimatedMinutes { get; set; } // typical trip duration

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public Guid? CreatedById { get; set; }

        // ── Navigation ───────────────────────────────────────────────────────
        public virtual ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
        public virtual ICollection<Trip> Trips { get; set; } = new List<Trip>();
    }
}