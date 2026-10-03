using Bookify.Domain.Entities;
using Bookify.Domain.Interfaces;
using Bookify.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Bookify.Infrastructure.Repositories;

public class CustomerRepository : Repository<Customer>, ICustomerRepository
{
	public CustomerRepository(ApplicationDbContext context) : base(context)
	{
	}

	public async Task<Customer?> GetByEmailAsync(string email)
	{
		return await _dbSet.FirstOrDefaultAsync(c => c.Email == email);
	}

	public async Task<bool> EmailExistsAsync(string email)
	{
		return await _dbSet.AnyAsync(c => c.Email == email);
	}
}
