using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuickTransit.API.Models.Entities
{
    public class TripLocation
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid TripId { get; set; }

        [Required]
        public decimal Latitude { get; set; }

        [Required]
        public decimal Longitude { get; set; }

        public decimal? Speed { get; set; } // km/h
        public decimal? Bearing { get; set; } // direction in degrees
        public decimal? Accuracy   { get; set; }

        public int? PassengerCount { get; set; }
        public decimal? Heading    { get; set; }
        public decimal? FuelLevel { get; set; }

        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("TripId")]
        public virtual Trip Trip { get; set; }



    }
}