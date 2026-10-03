using Bookify.Application.DTOs;
using Bookify.Application.Interfaces;
using Bookify.Domain.Entities;
using Bookify.Domain.Interfaces;

namespace Bookify.Application.Services;

public class ResourceService : IResourceService
{
	private readonly IResourceRepository _resourceRepository;

	public ResourceService(IResourceRepository resourceRepository)
	{
		_resourceRepository = resourceRepository;
	}

	public async Task<ResourceDto?> GetByIdAsync(int id)
	{
		var resource = await _resourceRepository.GetByIdAsync(id);
		return resource == null ? null : MapToDto(resource);
	}

	public async Task<IEnumerable<ResourceDto>> GetAllAsync()
	{
		var resources = await _resourceRepository.GetAllAsync();
		return resources.Select(MapToDto);
	}

	public async Task<IEnumerable<ResourceDto>> GetAvailableResourcesAsync()
	{
		var resources = await _resourceRepository.GetAvailableResourcesAsync();
		return resources.Select(MapToDto);
	}

	public async Task<ResourceDto> CreateAsync(CreateResourceDto createResourceDto)
	{
		var resource = new Resource
		{
			Name = createResourceDto.Name,
			Description = createResourceDto.Description,
			Capacity = createResourceDto.Capacity,
			IsAvailable = createResourceDto.IsAvailable,
			CreatedAt = DateTime.UtcNow
		};

		var createdResource = await _resourceRepository.AddAsync(resource);
		return MapToDto(createdResource);
	}

	public async Task UpdateAsync(int id, CreateResourceDto updateResourceDto)
	{
		var resource = await _resourceRepository.GetByIdAsync(id);
		if (resource == null)
		{
			throw new KeyNotFoundException("Resource not found.");
		}

		resource.Name = updateResourceDto.Name;
		resource.Description = updateResourceDto.Description;
		resource.Capacity = updateResourceDto.Capacity;
		resource.IsAvailable = updateResourceDto.IsAvailable;
		resource.UpdatedAt = DateTime.UtcNow;

		await _resourceRepository.UpdateAsync(resource);
	}

	public async Task DeleteAsync(int id)
	{
		if (!await _resourceRepository.ExistsAsync(id))
		{
			throw new KeyNotFoundException("Resource not found.");
		}

		await _resourceRepository.DeleteAsync(id);
	}

	private static ResourceDto MapToDto(Resource resource)
	{
		return new ResourceDto
		{
			Id = resource.Id,
			Name = resource.Name,
			Description = resource.Description,
			Capacity = resource.Capacity,
			IsAvailable = resource.IsAvailable,
			CreatedAt = resource.CreatedAt
		};
	}
}
