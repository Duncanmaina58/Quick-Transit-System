using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuickTransit.API.Models.Entities
{
    public class Report
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(100)]
        public string ReportType { get; set; } = string.Empty; // daily, weekly, monthly, compliance

        [Required]
        public string GeneratedBy { get; set; } = string.Empty; // user ID or system

        [MaxLength(500)]
        public string Parameters { get; set; } = string.Empty; // JSON of filters used

        [Required]
        public string FilePath { get; set; } = string.Empty; // Path to generated file

        [MaxLength(20)]
        public string Format { get; set; } = "pdf"; // pdf, excel, csv

        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PeriodStart { get; set; }
        public DateTime? PeriodEnd { get; set; }
    }
}