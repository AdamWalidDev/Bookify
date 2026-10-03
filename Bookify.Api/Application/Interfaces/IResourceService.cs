using Bookify.Application.DTOs;

namespace Bookify.Application.Interfaces;

public interface IResourceService
{
	Task<ResourceDto?> GetByIdAsync(int id);
	Task<IEnumerable<ResourceDto>> GetAllAsync();
	Task<IEnumerable<ResourceDto>> GetAvailableResourcesAsync();
	Task<ResourceDto> CreateAsync(CreateResourceDto createResourceDto);
	Task UpdateAsync(int id, CreateResourceDto updateResourceDto);
	Task DeleteAsync(int id);
}
