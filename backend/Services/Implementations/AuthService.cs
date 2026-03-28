using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QuickTransit.API.Data;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Models.Entities;
using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthService> _logger;

        public AuthService(ApplicationDbContext context, IConfiguration config, IEmailService emailService, ILogger<AuthService> logger)
        {
            _context = context;
            _config = config;
            _emailService = emailService;
            _logger = logger;
        }

        // ─── CREATE USER ──────────────────────────────────────────────────────────

        public async Task<CreateUserResponse> CreateUserAsync(CreateUserRequest request, Guid createdById)
        {
            // Validate role
            var validRoles = new[] { "driver", "conductor", "manager", "ntsa", "admin" };
            if (!validRoles.Contains(request.Role.ToLower()))
                throw new Exception($"Invalid role '{request.Role}'. Valid roles: {string.Join(", ", validRoles)}");

            // Check duplicate email
            var existing = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower().Trim());
            if (existing != null)
                throw new Exception("A user with this email already exists.");

            // Generate credentials
            var tempPassword = GenerateTemporaryPassword();
            var employeeId = await GenerateEmployeeIdAsync(request.Role);

            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = request.Email.ToLower().Trim(),
                PhoneNumber = request.PhoneNumber.Trim(),
                Role = request.Role.ToLower(),
                SaccoId = request.SaccoId,
                EmployeeId = employeeId,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                TemporaryPassword = tempPassword, // stored plain for first-login verification
                ForcePasswordChange = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedById = createdById
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Send email
            if (request.SendCredentials)
            {
                try
                {
                    await _emailService.SendWelcomeEmailAsync(
                        user.Email,
                        $"{user.FirstName} {user.LastName}",
                        user.EmployeeId,
                        tempPassword
                    );
                }
                catch (Exception ex)
                {
                    // Don't fail the whole request if email fails — log it
                    _logger.LogError(ex, "Failed to send welcome email to {Email}", user.Email);
                }
            }

            var saccoName = user.SaccoId.HasValue
                ? (await _context.Saccos.FindAsync(user.SaccoId))?.Name
                : null;

            return new CreateUserResponse
            {
                Success = true,
                Message = request.SendCredentials
                    ? "User created successfully. Credentials sent to their email."
                    : "User created successfully.",
                User = MapToUserResponse(user, saccoName),
                // Only return plain password in response when NOT emailing (so UI can display it)
                TemporaryPassword = request.SendCredentials ? null : tempPassword
            };
        }

        // ─── LOGIN ────────────────────────────────────────────────────────────────

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _context.Users
                .Include(u => u.Sacco)
                .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower().Trim());

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                throw new Exception("Invalid email or password.");

            if (!user.IsActive)
                throw new Exception("Your account has been deactivated. Contact your administrator.");

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);

            return new AuthResponse
            {
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddHours(8),
                ForcePasswordChange = user.ForcePasswordChange,
                User = MapToUserResponse(user, user.Sacco?.Name)
            };
        }

        // ─── FIRST TIME LOGIN (change temp password) ─────────────────────────────

        public async Task<AuthResponse> FirstTimeLoginAsync(FirstLoginRequest request)
        {
            if (request.NewPassword != request.ConfirmNewPassword)
                throw new Exception("Passwords do not match.");

            ValidatePasswordStrength(request.NewPassword);

            var user = await _context.Users
                .Include(u => u.Sacco)
                .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower().Trim());

            if (user == null)
                throw new Exception("User not found.");

            if (!user.ForcePasswordChange)
                throw new Exception("This account does not require a password change. Use the normal login.");

            // Verify they used the temporary password
            if (!BCrypt.Net.BCrypt.Verify(request.TemporaryPassword, user.PasswordHash))
                throw new Exception("Temporary password is incorrect.");

            // Set new password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.ForcePasswordChange = false;
            user.TemporaryPassword = null; // clear it
            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);

            return new AuthResponse
            {
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddHours(8),
                ForcePasswordChange = false,
                User = MapToUserResponse(user, user.Sacco?.Name)
            };
        }

        // ─── CHANGE PASSWORD ──────────────────────────────────────────────────────

        public async Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
        {
            if (request.NewPassword != request.ConfirmNewPassword)
                throw new Exception("Passwords do not match.");

            ValidatePasswordStrength(request.NewPassword);

            var user = await _context.Users.FindAsync(userId);
            if (user == null) throw new Exception("User not found.");

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                throw new Exception("Current password is incorrect.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.ForcePasswordChange = false;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        // ─── RESET PASSWORD (admin/manager) ───────────────────────────────────────

        public async Task<bool> ResetUserPasswordAsync(string email, Guid resetByUserId)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email.ToLower().Trim());

            if (user == null) throw new Exception("User not found.");

            var tempPassword = GenerateTemporaryPassword();

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword);
            user.TemporaryPassword = tempPassword;
            user.ForcePasswordChange = true;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            try
            {
                await _emailService.SendPasswordResetEmailAsync(
                    user.Email,
                    $"{user.FirstName} {user.LastName}",
                    tempPassword
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {Email}", user.Email);
                throw new Exception("Password reset but failed to send email. Please share credentials manually.");
            }

            return true;
        }

        // ─── ACTIVATE / DEACTIVATE ────────────────────────────────────────────────

        public async Task<bool> ActivateUserAsync(Guid userId, bool isActive, Guid updatedById)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) throw new Exception("User not found.");

            user.IsActive = isActive;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        // ─── GET ALL USERS (paged + filtered) ────────────────────────────────────

        public async Task<PagedResponse<UserResponse>> GetAllUsersAsync(UserFilterRequest filter)
        {
            var query = _context.Users
                .Include(u => u.Sacco)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Role))
                query = query.Where(u => u.Role == filter.Role.ToLower());

            if (filter.SaccoId.HasValue)
                query = query.Where(u => u.SaccoId == filter.SaccoId);

            if (filter.IsActive.HasValue)
                query = query.Where(u => u.IsActive == filter.IsActive);

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var s = filter.Search.ToLower();
                query = query.Where(u =>
                    u.FirstName.ToLower().Contains(s) ||
                    u.LastName.ToLower().Contains(s) ||
                    u.Email.ToLower().Contains(s) ||
                    u.EmployeeId.ToLower().Contains(s));
            }

            var total = await query.CountAsync();

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResponse<UserResponse>
            {
                Data = users.Select(u => MapToUserResponse(u, u.Sacco?.Name)).ToList(),
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalCount = total
            };
        }

        // ─── GET USER BY ID ───────────────────────────────────────────────────────

        public async Task<UserResponse> GetUserByIdAsync(Guid userId)
        {
            var user = await _context.Users
                .Include(u => u.Sacco)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) throw new Exception("User not found.");
            return MapToUserResponse(user, user.Sacco?.Name);
        }

        // ─── UPDATE USER ──────────────────────────────────────────────────────────

        public async Task<UserResponse> UpdateUserAsync(Guid userId, UpdateUserRequest request, Guid updatedById)
        {
            var user = await _context.Users
                .Include(u => u.Sacco)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) throw new Exception("User not found.");

            user.FirstName = request.FirstName.Trim();
            user.LastName = request.LastName.Trim();
            user.PhoneNumber = request.PhoneNumber.Trim();
            user.Role = request.Role.ToLower();
            user.SaccoId = request.SaccoId;
            user.IsActive = request.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Reload sacco name
            var saccoName = user.SaccoId.HasValue
                ? (await _context.Saccos.FindAsync(user.SaccoId))?.Name
                : null;

            return MapToUserResponse(user, saccoName);
        }

        // ─── PROFILE ──────────────────────────────────────────────────────────────

        public async Task<UserResponse> GetUserProfileAsync(Guid userId) => await GetUserByIdAsync(userId);

        public async Task<UserResponse> UpdateUserProfileAsync(Guid userId, UserUpdateRequest request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) throw new Exception("User not found.");

            user.FirstName = request.FirstName.Trim();
            user.LastName = request.LastName.Trim();
            user.PhoneNumber = request.PhoneNumber.Trim();
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToUserResponse(user, null);
        }

        // ─── HELPERS ──────────────────────────────────────────────────────────────

        private string GenerateJwtToken(User user)
        {
            var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]!);
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, user.Role),
                    new Claim("employeeId", user.EmployeeId),
                    new Claim("forcePasswordChange", user.ForcePasswordChange.ToString().ToLower()),
                    new Claim("saccoId", user.SaccoId?.ToString() ?? ""),
                }),
                Expires = DateTime.UtcNow.AddHours(8),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private async Task<string> GenerateEmployeeIdAsync(string role)
        {
            var prefix = role.ToLower() switch
            {
                "driver" => "DRV",
                "conductor" => "CDT",
                "manager" => "MGR",
                "admin" => "ADM",
                "ntsa" => "NTS",
                _ => "USR"
            };

            // Get highest existing number for this prefix to avoid collisions
            var lastId = await _context.Users
                .Where(u => u.EmployeeId.StartsWith(prefix))
                .OrderByDescending(u => u.EmployeeId)
                .Select(u => u.EmployeeId)
                .FirstOrDefaultAsync();

            int nextNum = 1001;
            if (lastId != null)
            {
                var parts = lastId.Split('-');
                if (parts.Length == 3 && int.TryParse(parts[2], out int last))
                    nextNum = last + 1;
            }

            return $"{prefix}-{DateTime.UtcNow.Year}-{nextNum}";
        }

        private string GenerateTemporaryPassword()
        {
            const string upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
            const string lower = "abcdefghjkmnpqrstuvwxyz";
            const string digits = "23456789";
            const string special = "!@#$%&";

            var rng = new Random();

            // Guarantee at least one of each character class
            var password = new List<char>
            {
                upper[rng.Next(upper.Length)],
                upper[rng.Next(upper.Length)],
                lower[rng.Next(lower.Length)],
                lower[rng.Next(lower.Length)],
                digits[rng.Next(digits.Length)],
                digits[rng.Next(digits.Length)],
                special[rng.Next(special.Length)],
                digits[rng.Next(digits.Length)],
            };

            // Shuffle
            return new string(password.OrderBy(_ => rng.Next()).ToArray());
        }

        private void ValidatePasswordStrength(string password)
        {
            if (password.Length < 8)
                throw new Exception("Password must be at least 8 characters.");
            if (!password.Any(char.IsUpper))
                throw new Exception("Password must contain at least one uppercase letter.");
            if (!password.Any(char.IsLower))
                throw new Exception("Password must contain at least one lowercase letter.");
            if (!password.Any(char.IsDigit))
                throw new Exception("Password must contain at least one number.");
            if (!password.Any(c => "!@#$%&*".Contains(c)))
                throw new Exception("Password must contain at least one special character (!@#$%&*).");
        }

        private static UserResponse MapToUserResponse(User user, string? saccoName) => new()
        {
            Id = user.Id,
            EmployeeId = user.EmployeeId,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            SaccoId = user.SaccoId,
            SaccoName = saccoName,
            IsActive = user.IsActive,
            ForcePasswordChange = user.ForcePasswordChange,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };
    }
}