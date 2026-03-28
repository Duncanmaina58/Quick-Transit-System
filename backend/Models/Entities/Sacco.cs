using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuickTransit.API.Models.Entities
{
    public class Sacco
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string RegistrationNumber { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Address { get; set; } = string.Empty;

        [MaxLength(200)]
        public string County { get; set; } = string.Empty;  // e.g. Nairobi, Mombasa

        [Phone]
        [MaxLength(20)]
        public string ContactPhone { get; set; } = string.Empty;

        [EmailAddress]
        [MaxLength(200)]
        public string ContactEmail { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        // The assigned manager for this SACCO
        public Guid? ManagerId { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public Guid? CreatedById { get; set; }

        // ── Navigation ───────────────────────────────────────────────────────
        [ForeignKey("ManagerId")]
        public virtual User? Manager { get; set; }

        public virtual ICollection<User> Users { get; set; } = new List<User>();
        public virtual ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
    }
}