using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Controllers
{
    [Route("api/trips")]
    [ApiController]
    [Authorize]
    public class TripController : ControllerBase
    {
        private readonly ITripService _tripService;
        private readonly ILogger<TripController> _logger;

        public TripController(ITripService tripService, ILogger<TripController> logger)
        {
            _tripService = tripService;
            _logger      = logger;
        }

        // ── Driver: get own context (active trip + assignment) ────────────────
        // GET api/trips/my-context
        [HttpGet("my-context")]
        [Authorize(Roles = "driver")]
        public async Task<IActionResult> GetMyContext()
        {
            try
            {
                var driverId = GetUserId();
                if (driverId == null) return Unauthorized();
                var result = await _tripService.GetDriverContextAsync(driverId.Value);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Driver: start trip ────────────────────────────────────────────────
        // POST api/trips/start
        [HttpPost("start")]
        [Authorize(Roles = "driver")]
        public async Task<IActionResult> StartTrip([FromBody] StartTripRequest request)
        {
            try
            {
                var driverId = GetUserId();
                if (driverId == null) return Unauthorized();
                var result = await _tripService.StartTripAsync(request, driverId.Value);
                return Ok(new { success = true, message = "Trip started.", data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Start trip failed");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // ── Driver: end trip ──────────────────────────────────────────────────
        // POST api/trips/{id}/end
        [HttpPost("{id:guid}/end")]
        [Authorize(Roles = "driver")]
        public async Task<IActionResult> EndTrip(Guid id, [FromBody] EndTripRequest request)
        {
            try
            {
                var driverId = GetUserId();
                if (driverId == null) return Unauthorized();
                var result = await _tripService.EndTripAsync(id, request, driverId.Value);
                return Ok(new { success = true, message = "Trip completed.", data = result });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Driver: cancel trip ───────────────────────────────────────────────
        // POST api/trips/{id}/cancel
        [HttpPost("{id:guid}/cancel")]
        [Authorize(Roles = "driver")]
        public async Task<IActionResult> CancelTrip(Guid id, [FromBody] string reason)
        {
            try
            {
                var driverId = GetUserId();
                if (driverId == null) return Unauthorized();
                var result = await _tripService.CancelTripAsync(id, reason, driverId.Value);
                return Ok(new { success = true, message = "Trip cancelled.", data = result });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Conductor: log passengers ─────────────────────────────────────────
        // POST api/trips/{id}/log-passengers
        [HttpPost("{id:guid}/log-passengers")]
        [Authorize(Roles = "conductor")]
        public async Task<IActionResult> LogPassengers(Guid id, [FromBody] LogPassengerRequest request)
        {
            try
            {
                var conductorId = GetUserId();
                if (conductorId == null) return Unauthorized();
                var result = await _tripService.LogPassengersAsync(id, request, conductorId.Value);
                return Ok(new { success = true, message = "Passengers logged.", data = result });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── All roles: get trips (scoped by role) ─────────────────────────────
        // GET api/trips
        [HttpGet]
        [Authorize(Roles = "admin,manager,driver,conductor,ntsa")]
        public async Task<IActionResult> GetTrips([FromQuery] TripFilterRequest filter)
        {
            try
            {
                var userId = GetUserId();
                if (userId == null) return Unauthorized();
                var result = await _tripService.GetTripsAsync(filter, userId.Value, GetRole()!);
                return Ok(result);
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── GET trip by ID ────────────────────────────────────────────────────
        // GET api/trips/{id}
        [HttpGet("{id:guid}")]
        [Authorize(Roles = "admin,manager,driver,conductor,ntsa")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var userId = GetUserId();
                if (userId == null) return Unauthorized();
                var result = await _tripService.GetTripByIdAsync(id, userId.Value, GetRole()!);
                return Ok(new { success = true, data = result });
            }
            catch (UnauthorizedAccessException) { return Forbid(); }
            catch (Exception ex) { return NotFound(new { success = false, message = ex.Message }); }
        }

        private Guid? GetUserId()
        {
            var c = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(c, out var id) ? id : null;
        }
        private string? GetRole() => User.FindFirst(ClaimTypes.Role)?.Value;
    }
}