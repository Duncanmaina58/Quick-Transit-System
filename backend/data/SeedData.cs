using Microsoft.EntityFrameworkCore;
using QuickTransit.API.Models.Entities;

namespace QuickTransit.API.Data
{
    public static class SeedData
    {
        public static async Task Initialize(IServiceProvider serviceProvider)
        {
            using var context = new ApplicationDbContext(
                serviceProvider.GetRequiredService<DbContextOptions<ApplicationDbContext>>());

            // Create admin user if not exists
            if (!await context.Users.AnyAsync(u => u.Email == "admin@quicktransit.com"))
            {
                var adminUser = new User
                {
                    FirstName = "System",
                    LastName = "Administrator",
                    Email = "admin@quicktransit.com",
                    PhoneNumber = "+254700000000",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    Role = "admin",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                context.Users.Add(adminUser);
                await context.SaveChangesAsync();
                Console.WriteLine("✅ Admin user created: admin@quicktransit.com / Admin123!");
            }

            // Create sample SACCO if not exists
            if (!await context.Saccos.AnyAsync())
            {
                var sacco = new Sacco
                {
                    Name = "Nairobi Metro SACCO",
                    RegistrationNumber = "SACCO-001",
                    Address = "Nairobi CBD",
                    ContactPhone = "+254711111111",
                    ContactEmail = "info@nairobimetro.com",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                context.Saccos.Add(sacco);
                await context.SaveChangesAsync();
                Console.WriteLine("✅ Sample SACCO created");
            }

            Console.WriteLine("✅ Database seeding completed");
        }
    }
}