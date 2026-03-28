using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuickTransit.API.Models.Entities
{
    public class PassengerLog
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid TripId { get; set; }

        public PassengerLogType LogType { get; set; } = PassengerLogType.Boarding;

        [MaxLength(100)]
        public string? StopName { get; set; }

        // ── Passenger Movement ─────────────────────────────
        public int PassengersBoarded { get; set; } = 0;
        public int PassengersAlighted { get; set; } = 0;

        // ── Current State ──────────────────────────────────
        public int CurrentPassengerCount { get; set; } = 0;

        // ✅ Added for compatibility with TripService
        public int PassengerCount { get; set; } = 0;

        // ── Location Tracking ─────────────────────────────
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }

        // ── Timestamp ─────────────────────────────────────
        public DateTime LogTime { get; set; } = DateTime.UtcNow;

        // ── Navigation ────────────────────────────────────
        [ForeignKey("TripId")]
        public virtual Trip? Trip { get; set; } // nullable to fix warnings
    }

    // public enum PassengerLogType
    // {
    //     Boarding = 1,
    //     Alighting = 2,
    //     Checkpoint = 3
    // }
}