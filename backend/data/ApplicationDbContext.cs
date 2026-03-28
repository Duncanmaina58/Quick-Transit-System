using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using QuickTransit.API.Models.Entities;
using RouteEntity = QuickTransit.API.Models.Entities.Route;

namespace QuickTransit.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<User>              Users              { get; set; }
        public DbSet<Sacco>             Saccos             { get; set; }
        public DbSet<Vehicle>           Vehicles           { get; set; }
        public DbSet<RouteEntity>       Routes             { get; set; }
        public DbSet<Trip>              Trips              { get; set; }
        public DbSet<PassengerLog>      PassengerLogs      { get; set; }
        public DbSet<Alert>             Alerts             { get; set; }
        public DbSet<TripLocation>      TripLocations      { get; set; }
        public DbSet<MaintenanceRecord> MaintenanceRecords { get; set; }
        public DbSet<Report>            Reports            { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ── USER ──────────────────────────────────────────────────────────
            modelBuilder.Entity<User>(e =>
            {
                e.HasIndex(u => u.Email).IsUnique();
                e.HasIndex(u => u.PhoneNumber).IsUnique();
                e.HasIndex(u => u.SaccoId);

                e.HasOne(u => u.Sacco)
                 .WithMany(s => s.Users)
                 .HasForeignKey(u => u.SaccoId)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            // ── SACCO ─────────────────────────────────────────────────────────
            modelBuilder.Entity<Sacco>(e =>
            {
                e.HasIndex(s => s.RegistrationNumber).IsUnique();

                e.HasOne(s => s.Manager)
                 .WithMany()
                 .HasForeignKey(s => s.ManagerId)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            // ── VEHICLE ───────────────────────────────────────────────────────
            modelBuilder.Entity<Vehicle>(e =>
            {
                e.HasIndex(v => v.RegistrationPlate).IsUnique();
                e.HasIndex(v => v.SaccoId);
                e.HasIndex(v => v.DriverId);
                e.HasIndex(v => v.ConductorId);

                e.HasOne(v => v.Sacco)
                 .WithMany(s => s.Vehicles)
                 .HasForeignKey(v => v.SaccoId)
                 .OnDelete(DeleteBehavior.Restrict);

                // Two FKs to User — must specify explicitly to avoid ambiguity
                e.HasOne(v => v.Driver)
                 .WithMany()
                 .HasForeignKey(v => v.DriverId)
                 .OnDelete(DeleteBehavior.SetNull);

                e.HasOne(v => v.Conductor)
                 .WithMany()
                 .HasForeignKey(v => v.ConductorId)
                 .OnDelete(DeleteBehavior.SetNull);

                // Direct Route FK on Vehicle
                e.HasOne(v => v.Route)
                 .WithMany(r => r.Vehicles)
                 .HasForeignKey(v => v.RouteId)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            // ── ROUTE ─────────────────────────────────────────────────────────
            modelBuilder.Entity<RouteEntity>(e =>
            {
                e.HasIndex(r => r.RouteCode).IsUnique();
                e.HasIndex(r => r.Name).IsUnique();
            });

            // ── TRIP ──────────────────────────────────────────────────────────
            modelBuilder.Entity<Trip>(e =>
            {
                e.HasIndex(t => t.VehicleId);
                e.HasIndex(t => t.RouteId);
                e.HasIndex(t => t.DriverId);
                e.HasIndex(t => t.ConductorId);

                e.HasOne(t => t.Driver)
                 .WithMany()
                 .HasForeignKey(t => t.DriverId)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(t => t.Conductor)
                 .WithMany()
                 .HasForeignKey(t => t.ConductorId)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(t => t.Vehicle)
                 .WithMany(v => v.Trips)
                 .HasForeignKey(t => t.VehicleId)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(t => t.Route)
                 .WithMany(r => r.Trips)
                 .HasForeignKey(t => t.RouteId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // ── PASSENGER LOG ─────────────────────────────────────────────────
            modelBuilder.Entity<PassengerLog>(e =>
            {
                e.HasIndex(pl => pl.TripId);
                e.HasIndex(pl => pl.LogTime);

                e.HasOne(pl => pl.Trip)
                 .WithMany(t => t.PassengerLogs)
                 .HasForeignKey(pl => pl.TripId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── ALERT ─────────────────────────────────────────────────────────
            modelBuilder.Entity<Alert>(e =>
            {
                e.HasIndex(a => a.TripId);
                e.HasIndex(a => a.VehicleId);
                e.HasIndex(a => a.ReportedById);

                e.HasOne(a => a.Trip)
                 .WithMany(t => t.Alerts)
                 .HasForeignKey(a => a.TripId)
                 .OnDelete(DeleteBehavior.Cascade);

                // Vehicle → Alerts relationship — Vehicle entity doesn't have
                // an Alerts collection, so use no inverse navigation
                e.HasOne(a => a.Vehicle)
                 .WithMany()
                 .HasForeignKey(a => a.VehicleId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(a => a.ReportedBy)
                 .WithMany()
                 .HasForeignKey(a => a.ReportedById)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // ── TRIP LOCATION ─────────────────────────────────────────────────
            modelBuilder.Entity<TripLocation>(e =>
            {
                e.HasIndex(tl => tl.TripId);
                e.HasIndex(tl => tl.RecordedAt);

                e.HasOne(tl => tl.Trip)
                 .WithMany(t => t.TripLocations)
                 .HasForeignKey(tl => tl.TripId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── MAINTENANCE RECORD ────────────────────────────────────────────
            modelBuilder.Entity<MaintenanceRecord>(e =>
            {
                e.HasIndex(mr => mr.VehicleId);
                e.HasIndex(mr => mr.MaintenanceDate);

                e.HasOne(mr => mr.Vehicle)
                 .WithMany()
                 .HasForeignKey(mr => mr.VehicleId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── REPORT ────────────────────────────────────────────────────────
            modelBuilder.Entity<Report>(e =>
            {
                e.HasIndex(r => r.ReportType);
                e.HasIndex(r => r.GeneratedAt);
                e.HasIndex(r => r.GeneratedBy);
            });
        }
    }
}