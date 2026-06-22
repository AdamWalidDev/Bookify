using Bookify.Domain.Entities;

namespace Bookify.Domain.Interfaces;

public interface IResourceRepository : IRepository<Resource>
{
	Task<IEnumerable<Resource>> GetAvailableResourcesAsync();
}
