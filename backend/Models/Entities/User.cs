using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuickTransit.API.Models.Entities
{
    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(200)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = "driver"; // driver, conductor, manager, ntsa, admin

        [MaxLength(30)]
        public string EmployeeId { get; set; } = string.Empty; // e.g. QT-2024-4521

        public Guid? SaccoId { get; set; }
        public bool IsActive { get; set; } = true;
        public bool ForcePasswordChange { get; set; } = true;
        public string? TemporaryPassword { get; set; } // plain-text stored briefly, cleared after first login

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public Guid? CreatedById { get; set; }

        // Navigation properties
        [ForeignKey("SaccoId")]
        public virtual Sacco? Sacco { get; set; }

        public virtual ICollection<Trip> Trips { get; set; } = new List<Trip>();
    }
}