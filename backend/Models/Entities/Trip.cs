using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuickTransit.API.Models.Entities
{
    public enum TripStatus
    {
        Scheduled  = 1,
        InProgress = 2,
        Completed  = 3,
        Cancelled  = 4,
    }

    public enum PassengerLogType
    {
        Boarding   = 1,
        Alighting  = 2,
        Checkpoint = 3,
    }

    public class Trip
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid VehicleId { get; set; }

        [Required]
        public Guid RouteId { get; set; }

        [Required]
        public Guid DriverId { get; set; }

        public Guid? ConductorId { get; set; }

        public TripStatus Status { get; set; } = TripStatus.Scheduled;

        public DateTime? ScheduledStartTime { get; set; }
        public DateTime? ActualStartTime { get; set; }
        public DateTime? ActualEndTime { get; set; }

        public int? InitialPassengerCount { get; set; }
        public int? FinalPassengerCount { get; set; }
        public int? PeakPassengerCount { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // ── Navigation ───────────────────────────────────────────────────────
        [ForeignKey("VehicleId")]
        public virtual Vehicle Vehicle { get; set; } = null!;

        [ForeignKey("RouteId")]
        public virtual Route Route { get; set; } = null!;

        [ForeignKey("DriverId")]
        public virtual User Driver { get; set; } = null!;

        [ForeignKey("ConductorId")]
        public virtual User? Conductor { get; set; }

        public virtual ICollection<PassengerLog> PassengerLogs { get; set; } = new List<PassengerLog>();
        public virtual ICollection<Alert> Alerts { get; set; } = new List<Alert>();
        public virtual ICollection<TripLocation> TripLocations { get; set; } = new List<TripLocation>();
    }
}