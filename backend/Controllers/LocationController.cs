using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Controllers
{
    [Route("api/locations")]
    [ApiController]
    [Authorize]
    public class LocationController : ControllerBase
    {
        private readonly ILocationService _locationService;

        public LocationController(ILocationService locationService)
            => _locationService = locationService;

        // POST api/locations/trip/:tripId — driver posts their GPS
        [HttpPost("trip/{tripId:guid}")]
        [Authorize(Roles = "driver")]
        public async Task<IActionResult> PostLocation(
            Guid tripId, [FromBody] PostLocationRequest request)
        {
            try
            {
                var driverId = GetUserId();
                if (driverId == null) return Unauthorized();
                await _locationService.PostLocationAsync(tripId, request, driverId.Value);
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET api/locations/active — manager gets all active vehicles
        [HttpGet("active")]
        [Authorize(Roles = "manager,admin")]
        public async Task<IActionResult> GetActiveLocations()
        {
            try
            {
                var userId = GetUserId();
                if (userId == null) return Unauthorized();
                var result = await _locationService.GetActiveVehicleLocationsAsync(userId.Value);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET api/locations/trip/:tripId/path — full breadcrumb path
        [HttpGet("trip/{tripId:guid}/path")]
        [Authorize(Roles = "admin,manager,driver,conductor")]
        public async Task<IActionResult> GetTripPath(Guid tripId)
        {
            try
            {
                var result = await _locationService.GetTripPathAsync(tripId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET api/locations/trip/:tripId — single vehicle latest position
        [HttpGet("trip/{tripId:guid}")]
        [Authorize(Roles = "admin,manager,driver,conductor")]
        public async Task<IActionResult> GetVehicleLocation(Guid tripId)
        {
            try
            {
                var result = await _locationService.GetVehicleLocationAsync(tripId);
                if (result == null)
                    return NotFound(new { success = false, message = "No location data yet." });
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        private Guid? GetUserId()
        {
            var c = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(c, out var id) ? id : null;
        }
    }
}