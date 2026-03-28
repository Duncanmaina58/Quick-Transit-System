using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Controllers.Admin
{
    [Route("api/admin/saccos")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class SaccoController : ControllerBase
    {
        private readonly ISaccoService _saccoService;
        private readonly ILogger<SaccoController> _logger;

        public SaccoController(ISaccoService saccoService, ILogger<SaccoController> logger)
        {
            _saccoService = saccoService;
            _logger = logger;
        }

        // GET api/admin/saccos
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] SaccoFilterRequest filter)
        {
            try
            {
                var result = await _saccoService.GetAllSaccosAsync(filter);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET api/admin/saccos/summaries  (dropdown data)
        [HttpGet("summaries")]
        [Authorize(Roles = "admin,manager")]  // managers need this for their own UI
        public async Task<IActionResult> GetSummaries()
        {
            try
            {
                var result = await _saccoService.GetSaccoSummariesAsync();
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET api/admin/saccos/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var result = await _saccoService.GetSaccoByIdAsync(id);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
        }

        // POST api/admin/saccos
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSaccoRequest request)
        {
            try
            {
                var createdById = GetCurrentUserId();
                if (createdById == null) return Unauthorized();

                var result = await _saccoService.CreateSaccoAsync(request, createdById.Value);
                return Ok(new { success = true, message = "SACCO created successfully.", data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create SACCO");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT api/admin/saccos/{id}
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSaccoRequest request)
        {
            try
            {
                var updatedById = GetCurrentUserId();
                if (updatedById == null) return Unauthorized();

                var result = await _saccoService.UpdateSaccoAsync(id, request, updatedById.Value);
                return Ok(new { success = true, message = "SACCO updated successfully.", data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT api/admin/saccos/{id}/assign-manager
        [HttpPut("{id:guid}/assign-manager")]
        public async Task<IActionResult> AssignManager(Guid id, [FromBody] AssignManagerRequest request)
        {
            try
            {
                var assignedById = GetCurrentUserId();
                if (assignedById == null) return Unauthorized();

                var result = await _saccoService.AssignManagerAsync(id, request.ManagerId, assignedById.Value);
                return Ok(new { success = true, message = "Manager assigned successfully.", data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // DELETE api/admin/saccos/{id}/manager
        [HttpDelete("{id:guid}/manager")]
        public async Task<IActionResult> RemoveManager(Guid id)
        {
            try
            {
                var removedById = GetCurrentUserId();
                if (removedById == null) return Unauthorized();

                var result = await _saccoService.RemoveManagerAsync(id, removedById.Value);
                return Ok(new { success = true, message = "Manager removed successfully.", data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT api/admin/saccos/{id}/activate
        [HttpPut("{id:guid}/activate")]
        public async Task<IActionResult> Activate(Guid id, [FromBody] bool isActive)
        {
            try
            {
                var updatedById = GetCurrentUserId();
                if (updatedById == null) return Unauthorized();

                await _saccoService.ActivateSaccoAsync(id, isActive, updatedById.Value);
                return Ok(new { success = true, message = $"SACCO {(isActive ? "activated" : "deactivated")} successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // DELETE api/admin/saccos/{id}
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var deletedById = GetCurrentUserId();
                if (deletedById == null) return Unauthorized();

                await _saccoService.DeleteSaccoAsync(id, deletedById.Value);
                return Ok(new { success = true, message = "SACCO deleted successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        private Guid? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }
}