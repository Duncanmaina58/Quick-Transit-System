using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuickTransit.API.Models.Entities
{
    public class VehicleRoute
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid VehicleId { get; set; }

        [Required]
        public Guid RouteId { get; set; }

        public bool IsActive { get; set; } = true;
        public DateTime AssignedDate { get; set; } = DateTime.UtcNow;
        public DateTime? UnassignedDate { get; set; }

        // Navigation properties
        [ForeignKey("VehicleId")]
        public virtual Vehicle Vehicle { get; set; }

        [ForeignKey("RouteId")]
        public virtual Route Route { get; set; }
    }
}