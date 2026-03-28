using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Controllers.Admin
{
    [Route("api/admin/users")]
    [ApiController]
    [Authorize(Roles = "admin,manager")]
    public class UsersManagementController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<UsersManagementController> _logger;

        public UsersManagementController(IAuthService authService, ILogger<UsersManagementController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        // POST api/admin/users/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            try
            {
                var createdById = GetCurrentUserId();
                if (createdById == null) return Unauthorized();

                // Managers can only create users for their own SACCO
                if (GetCurrentUserRole() == "manager")
                {
                    var managerSaccoId = GetCurrentUserSaccoId();
                    if (managerSaccoId == null)
                        return BadRequest(new { success = false, message = "Your account is not assigned to a SACCO. Contact the system administrator." });

                    // Force the new user into the manager's SACCO regardless of what was sent
                    if (!Guid.TryParse(managerSaccoId, out var saccoGuid))
    return BadRequest(new { success = false, message = "Invalid SACCO ID in token." });

request.SaccoId = saccoGuid;

                    // Managers cannot create admins or other managers
                    if (request.Role is "admin" or "manager" or "ntsa")
                        return Forbid();
                }

                var response = await _authService.CreateUserAsync(request, createdById.Value);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create user");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET api/admin/users
        [HttpGet]
        public async Task<IActionResult> GetAllUsers([FromQuery] UserFilterRequest filter)
        {
            try
            {
                // Managers only see their own SACCO's users
                if (GetCurrentUserRole() == "manager")
                {
                    var managerSaccoId = GetCurrentUserSaccoId();
                    if (Guid.TryParse(managerSaccoId, out var saccoGuid))
                        {
    filter.SaccoId = saccoGuid;
}
                }

                var response = await _authService.GetAllUsersAsync(filter);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET api/admin/users/{userId}
        [HttpGet("{userId:guid}")]
        public async Task<IActionResult> GetUser(Guid userId)
        {
            try
            {
                var user = await _authService.GetUserByIdAsync(userId);

                // Manager can only view users in their SACCO
                if (GetCurrentUserRole() == "manager")
                {
                    var managerSaccoId = GetCurrentUserSaccoId();
                    if (user.SaccoId?.ToString() != managerSaccoId)
                        return Forbid();
                }

                return Ok(new { success = true, data = user });
            }
            catch (Exception ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
        }

        // PUT api/admin/users/{userId}
        [HttpPut("{userId:guid}")]
        public async Task<IActionResult> UpdateUser(Guid userId, [FromBody] UpdateUserRequest request)
        {
            try
            {
                var updatedById = GetCurrentUserId();
                if (updatedById == null) return Unauthorized();

                if (GetCurrentUserRole() == "manager")
                {
                    var managerSaccoId = GetCurrentUserSaccoId();
                    var target = await _authService.GetUserByIdAsync(userId);
                    if (target.SaccoId?.ToString() != managerSaccoId) return Forbid();

                    // Manager cannot elevate roles
                    if (request.Role is "admin" or "manager" or "ntsa") return Forbid();
                }

                var user = await _authService.UpdateUserAsync(userId, request, updatedById.Value);
                return Ok(new { success = true, message = "User updated successfully.", data = user });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // POST api/admin/users/reset-password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                var resetById = GetCurrentUserId();
                if (resetById == null) return Unauthorized();

                await _authService.ResetUserPasswordAsync(request.Email, resetById.Value);
                return Ok(new { success = true, message = "Password reset. Credentials sent to user's email." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT api/admin/users/{userId}/activate  — admin only
        [HttpPut("{userId:guid}/activate")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ActivateUser(Guid userId, [FromBody] bool isActive)
        {
            try
            {
                var updatedById = GetCurrentUserId();
                if (updatedById == null) return Unauthorized();

                await _authService.ActivateUserAsync(userId, isActive, updatedById.Value);
                return Ok(new { success = true, message = $"User {(isActive ? "activated" : "deactivated")} successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        private Guid? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claim, out var id) ? id : null;
        }

        private string? GetCurrentUserRole() =>
            User.FindFirst(ClaimTypes.Role)?.Value;

        // SaccoId is embedded in the JWT by AuthService.GenerateJwtToken
        private string? GetCurrentUserSaccoId() =>
            User.FindFirst("saccoId")?.Value is { Length: > 0 } id ? id : null;
    }
}