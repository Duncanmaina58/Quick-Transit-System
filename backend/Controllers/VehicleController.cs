using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Controllers
{
    [Route("api/vehicles")]
    [ApiController]
    [Authorize(Roles = "admin,manager")]
    public class VehicleController : ControllerBase
    {
        private readonly IVehicleService _vehicleService;
        private readonly ILogger<VehicleController> _logger;

        public VehicleController(IVehicleService vehicleService, ILogger<VehicleController> logger)
        {
            _vehicleService = vehicleService;
            _logger = logger;
        }

        // GET api/vehicles
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] VehicleFilterRequest filter)
        {
            try
            {
                var result = await _vehicleService.GetVehiclesAsync(filter, GetUserId()!.Value, GetRole()!);
                return Ok(result);
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET api/vehicles/summaries?saccoId=...
        [HttpGet("summaries")]
        public async Task<IActionResult> GetSummaries([FromQuery] Guid saccoId)
        {
            try
            {
                var result = await _vehicleService.GetVehicleSummariesAsync(saccoId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET api/vehicles/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var result = await _vehicleService.GetVehicleByIdAsync(id, GetUserId()!.Value, GetRole()!);
                return Ok(new { success = true, data = result });
            }
            catch (UnauthorizedAccessException) { return Forbid(); }
            catch (Exception ex) { return NotFound(new { success = false, message = ex.Message }); }
        }

        // POST api/vehicles
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateVehicleRequest request)
        {
            try
            {
                var result = await _vehicleService.CreateVehicleAsync(request, GetUserId()!.Value);
                return Ok(new { success = true, message = "Vehicle registered.", data = result });
            }
            catch (Exception ex) { _logger.LogError(ex, "Create vehicle failed"); return BadRequest(new { success = false, message = ex.Message }); }
        }

        // PUT api/vehicles/{id}
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVehicleRequest request)
        {
            try
            {
                var result = await _vehicleService.UpdateVehicleAsync(id, request, GetUserId()!.Value, GetRole()!);
                return Ok(new { success = true, message = "Vehicle updated.", data = result });
            }
            catch (UnauthorizedAccessException) { return Forbid(); }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // PUT api/vehicles/{id}/assign-crew
        [HttpPut("{id:guid}/assign-crew")]
        public async Task<IActionResult> AssignCrew(Guid id, [FromBody] AssignCrewRequest request)
        {
            try
            {
                var result = await _vehicleService.AssignCrewAsync(id, request, GetUserId()!.Value);
                return Ok(new { success = true, message = "Crew assigned.", data = result });
            }
            catch (UnauthorizedAccessException) { return Forbid(); }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // PUT api/vehicles/{id}/assign-route
        [HttpPut("{id:guid}/assign-route")]
        public async Task<IActionResult> AssignRoute(Guid id, [FromBody] AssignRouteRequest request)
        {
            try
            {
                var result = await _vehicleService.AssignRouteAsync(id, request, GetUserId()!.Value);
                return Ok(new { success = true, message = "Route assigned.", data = result });
            }
            catch (UnauthorizedAccessException) { return Forbid(); }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // PUT api/vehicles/{id}/status
        [HttpPut("{id:guid}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateVehicleStatusRequest request)
        {
            try
            {
                var result = await _vehicleService.UpdateStatusAsync(id, request, GetUserId()!.Value, GetRole()!);
                return Ok(new { success = true, message = "Status updated.", data = result });
            }
            catch (UnauthorizedAccessException) { return Forbid(); }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // DELETE api/vehicles/{id}
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                await _vehicleService.DeleteVehicleAsync(id, GetUserId()!.Value, GetRole()!);
                return Ok(new { success = true, message = "Vehicle deleted." });
            }
            catch (UnauthorizedAccessException) { return Forbid(); }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        private Guid? GetUserId()
        {
            var c = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(c, out var id) ? id : null;
        }

        private string? GetRole() => User.FindFirst(ClaimTypes.Role)?.Value;
    }
}