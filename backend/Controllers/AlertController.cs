using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Controllers
{
    [Route("api/alerts")]
    [ApiController]
    [Authorize]
    public class AlertController : ControllerBase
    {
        private readonly IAlertService _alertService;

        public AlertController(IAlertService alertService) => _alertService = alertService;

        // POST api/alerts — driver or conductor reports incident
        [HttpPost]
        [Authorize(Roles = "driver,conductor,manager")]
        public async Task<IActionResult> CreateIncident([FromBody] CreateIncidentRequest request)
        {
            try
            {
                var uid = GetUserId(); if (uid == null) return Unauthorized();
                var result = await _alertService.CreateIncidentAsync(request, uid.Value);
                return Ok(new { success = true, message = "Incident reported.", data = result });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET api/alerts — scoped by role
        [HttpGet]
        [Authorize(Roles = "admin,manager,driver,conductor")]
        public async Task<IActionResult> GetAlerts([FromQuery] AlertFilterRequest filter)
        {
            try
            {
                var uid = GetUserId(); if (uid == null) return Unauthorized();
                var result = await _alertService.GetAlertsAsync(filter, uid.Value, GetRole()!);
                return Ok(result);
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET api/alerts/live-trip/:tripId — live trip data (driver polls this)
        [HttpGet("live-trip/{tripId:guid}")]
        [Authorize(Roles = "driver,conductor")]
        public async Task<IActionResult> GetLiveTrip(Guid tripId)
        {
            try
            {
                var result = await _alertService.GetLiveTripAsync(tripId);
                if (result == null) return NotFound(new { success = false, message = "No active trip found." });
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // PUT api/alerts/:id/acknowledge
        [HttpPut("{id:guid}/acknowledge")]
        [Authorize(Roles = "admin,manager")]
        public async Task<IActionResult> Acknowledge(Guid id, [FromBody] AcknowledgeAlertRequest request)
        {
            try
            {
                var uid = GetUserId(); if (uid == null) return Unauthorized();
                var result = await _alertService.AcknowledgeAlertAsync(id, request, uid.Value);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // PUT api/alerts/:id/resolve
        [HttpPut("{id:guid}/resolve")]
        [Authorize(Roles = "admin,manager")]
        public async Task<IActionResult> Resolve(Guid id, [FromBody] string? notes)
        {
            try
            {
                var uid = GetUserId(); if (uid == null) return Unauthorized();
                var result = await _alertService.ResolveAlertAsync(id, notes, uid.Value);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET api/alerts/my-shift — driver/conductor shift context
        [HttpGet("my-shift")]
        [Authorize(Roles = "driver,conductor")]
        public async Task<IActionResult> GetMyShift(
            [FromServices] IShiftService shiftService)
        {
            try
            {
                var uid = GetUserId(); if (uid == null) return Unauthorized();
                var role = GetRole();
                var result = role == "driver"
                    ? await shiftService.GetDriverShiftContextAsync(uid.Value)
                    : await shiftService.GetConductorShiftContextAsync(uid.Value);
                return Ok(new { success = true, data = result });
            }
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