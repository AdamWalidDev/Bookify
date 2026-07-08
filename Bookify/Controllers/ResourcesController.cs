using Bookify.Application.DTOs;
using Bookify.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Bookify.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ResourcesController : ControllerBase
{
	private readonly IResourceService _resourceService;

	public ResourcesController(IResourceService resourceService)
	{
		_resourceService = resourceService;
	}

	[HttpGet]
	public async Task<ActionResult<IEnumerable<ResourceDto>>> GetAll()
	{
		var resources = await _resourceService.GetAllAsync();
		return Ok(resources);
	}

	[HttpGet("{id}")]
	public async Task<ActionResult<ResourceDto>> GetById(int id)
	{
		var resource = await _resourceService.GetByIdAsync(id);
		if (resource == null)
		{
			return NotFound();
		}
		return Ok(resource);
	}

	[HttpGet("available")]
	public async Task<ActionResult<IEnumerable<ResourceDto>>> GetAvailable()
	{
		var resources = await _resourceService.GetAvailableResourcesAsync();
		return Ok(resources);
	}

	[HttpPost]
	public async Task<ActionResult<ResourceDto>> Create([FromBody] CreateResourceDto createResourceDto)
	{
		var resource = await _resourceService.CreateAsync(createResourceDto);
		return CreatedAtAction(nameof(GetById), new { id = resource.Id }, resource);
	}

	[HttpPut("{id}")]
	public async Task<IActionResult> Update(int id, [FromBody] CreateResourceDto updateResourceDto)
	{
		try
		{
			await _resourceService.UpdateAsync(id, updateResourceDto);
			return NoContent();
		}
		catch (KeyNotFoundException)
		{
			return NotFound();
		}
	}

	[HttpDelete("{id}")]
	public async Task<IActionResult> Delete(int id)
	{
		try
		{
			await _resourceService.DeleteAsync(id);
			return NoContent();
		}
		catch (KeyNotFoundException)
		{
			return NotFound();
		}
	}
}
