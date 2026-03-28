namespace QuickTransit.API.Models.DTOs
{
    // ========== ADMIN USER MANAGEMENT DTOs ==========

    public class CreateUserRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role { get; set; } = "driver"; // driver, conductor, manager, ntsa, admin
        public Guid? SaccoId { get; set; }
        public bool SendCredentials { get; set; } = true;
    }

    public class UpdateUserRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public Guid? SaccoId { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class ResetPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
        public bool SendNewPassword { get; set; } = true;
    }

    public class UserFilterRequest
    {
        public string? Role { get; set; }
        public Guid? SaccoId { get; set; }
        public bool? IsActive { get; set; }
        public string? Search { get; set; } // search by name or email
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    // ========== AUTHENTICATION DTOs ==========

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class FirstLoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string TemporaryPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmNewPassword { get; set; } = string.Empty;
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmNewPassword { get; set; } = string.Empty;
    }

    public class UserUpdateRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }

    // ========== RESPONSE DTOs ==========

    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public bool ForcePasswordChange { get; set; }
        public UserResponse User { get; set; } = new UserResponse();
    }

    public class UserResponse
    {
        public Guid Id { get; set; }
        public string EmployeeId { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName => $"{FirstName} {LastName}";
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public Guid? SaccoId { get; set; }
        public string? SaccoName { get; set; }
        public bool IsActive { get; set; }
        public bool ForcePasswordChange { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }

    public class CreateUserResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public UserResponse User { get; set; } = new UserResponse();
        public string? TemporaryPassword { get; set; } // Only returned when SendCredentials = false
    }

    public class PagedResponse<T>
    {
        public List<T> Data { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public bool HasNext => Page < TotalPages;
        public bool HasPrevious => Page > 1;
    }
}