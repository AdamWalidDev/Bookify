using Bookify.Application.DTOs;

namespace Bookify.Application.Interfaces;

public interface ICustomerService
{
	Task<CustomerDto?> GetByIdAsync(int id);
	Task<IEnumerable<CustomerDto>> GetAllAsync();
	Task<CustomerDto?> GetByEmailAsync(string email);
	Task<CustomerDto> CreateAsync(CreateCustomerDto createCustomerDto);
	Task UpdateAsync(int id, CreateCustomerDto updateCustomerDto);
	Task DeleteAsync(int id);
}
