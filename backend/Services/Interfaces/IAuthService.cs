using QuickTransit.API.Models.DTOs;

namespace QuickTransit.API.Services.Interfaces
{
    public interface IAuthService
    {
        // Admin/Manager: user management
        Task<CreateUserResponse> CreateUserAsync(CreateUserRequest request, Guid createdById);
        Task<bool> ResetUserPasswordAsync(string email, Guid resetByUserId);
        Task<bool> ActivateUserAsync(Guid userId, bool isActive, Guid updatedById);
        Task<PagedResponse<UserResponse>> GetAllUsersAsync(UserFilterRequest filter);
        Task<UserResponse> GetUserByIdAsync(Guid userId);
        Task<UserResponse> UpdateUserAsync(Guid userId, UpdateUserRequest request, Guid updatedById);

        // Authentication
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<AuthResponse> FirstTimeLoginAsync(FirstLoginRequest request);
        Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);

        // Profile
        Task<UserResponse> GetUserProfileAsync(Guid userId);
        Task<UserResponse> UpdateUserProfileAsync(Guid userId, UserUpdateRequest request);
    }
}