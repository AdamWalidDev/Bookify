using Bookify.Domain.Entities;

namespace Bookify.Domain.Interfaces;

public interface ICustomerRepository : IRepository<Customer>
{
	Task<Customer?> GetByEmailAsync(string email);
	Task<bool> EmailExistsAsync(string email);
}
