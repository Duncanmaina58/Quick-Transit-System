using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickTransit.API.Models.DTOs;
using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Controllers
{
    [Route("api/routes")]
    [ApiController]
    public class RouteController : ControllerBase
    {
        private readonly IRouteService _routeService;

        public RouteController(IRouteService routeService) => _routeService = routeService;

        // GET api/routes  — all roles can view
        [HttpGet]
        [Authorize(Roles = "admin,manager,driver,conductor")]
        public async Task<IActionResult> GetAll([FromQuery] RouteFilterRequest filter)
        {
            try { return Ok(await _routeService.GetRoutesAsync(filter)); }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET api/routes/summaries  — all roles, for dropdowns
        [HttpGet("summaries")]
        [Authorize(Roles = "admin,manager,driver,conductor")]
        public async Task<IActionResult> GetSummaries()
        {
            try { return Ok(new { success = true, data = await _routeService.GetRouteSummariesAsync() }); }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET api/routes/{id}
        [HttpGet("{id:guid}")]
        [Authorize(Roles = "admin,manager,driver,conductor")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try { return Ok(new { success = true, data = await _routeService.GetRouteByIdAsync(id) }); }
            catch (Exception ex) { return NotFound(new { success = false, message = ex.Message }); }
        }

        // POST api/routes  — admin only
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] CreateRouteRequest request)
        {
            try
            {
                var adminId = GetUserId();
                if (adminId == null) return Unauthorized();
                return Ok(new { success = true, message = "Route created.", data = await _routeService.CreateRouteAsync(request, adminId.Value) });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // PUT api/routes/{id}  — admin only
        [HttpPut("{id:guid}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRouteRequest request)
        {
            try
            {
                var adminId = GetUserId();
                if (adminId == null) return Unauthorized();
                return Ok(new { success = true, message = "Route updated.", data = await _routeService.UpdateRouteAsync(id, request, adminId.Value) });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // PUT api/routes/{id}/activate  — admin only
        [HttpPut("{id:guid}/activate")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Activate(Guid id, [FromBody] bool isActive)
        {
            try
            {
                var adminId = GetUserId();
                if (adminId == null) return Unauthorized();
                await _routeService.ActivateRouteAsync(id, isActive, adminId.Value);
                return Ok(new { success = true, message = $"Route {(isActive ? "activated" : "deactivated")}." });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // DELETE api/routes/{id}  — admin only
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var adminId = GetUserId();
                if (adminId == null) return Unauthorized();
                await _routeService.DeleteRouteAsync(id, adminId.Value);
                return Ok(new { success = true, message = "Route deleted." });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        private Guid? GetUserId()
        {
            var c = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(c, out var id) ? id : null;
        }
    }
}