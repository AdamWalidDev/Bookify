using Bookify.Domain.Entities;
using Bookify.Domain.Interfaces;
using Bookify.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Bookify.Infrastructure.Repositories;

public class ResourceRepository : Repository<Resource>, IResourceRepository
{
	public ResourceRepository(ApplicationDbContext context) : base(context)
	{
	}

	public async Task<IEnumerable<Resource>> GetAvailableResourcesAsync()
	{
		return await _dbSet
			.Where(r => r.IsAvailable)
			.ToListAsync();
	}
}
