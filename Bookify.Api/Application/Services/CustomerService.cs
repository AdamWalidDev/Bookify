using Bookify.Application.DTOs;
using Bookify.Application.Interfaces;
using Bookify.Domain.Entities;
using Bookify.Domain.Interfaces;

namespace Bookify.Application.Services;

public class CustomerService : ICustomerService
{
	private readonly ICustomerRepository _customerRepository;

	public CustomerService(ICustomerRepository customerRepository)
	{
		_customerRepository = customerRepository;
	}

	public async Task<CustomerDto?> GetByIdAsync(int id)
	{
		var customer = await _customerRepository.GetByIdAsync(id);
		return customer == null ? null : MapToDto(customer);
	}

	public async Task<IEnumerable<CustomerDto>> GetAllAsync()
	{
		var customers = await _customerRepository.GetAllAsync();
		return customers.Select(MapToDto);
	}

	public async Task<CustomerDto?> GetByEmailAsync(string email)
	{
		var customer = await _customerRepository.GetByEmailAsync(email);
		return customer == null ? null : MapToDto(customer);
	}

	public async Task<CustomerDto> CreateAsync(CreateCustomerDto createCustomerDto)
	{
		// Validate email uniqueness
		if (await _customerRepository.EmailExistsAsync(createCustomerDto.Email))
		{
			throw new InvalidOperationException("A customer with this email already exists.");
		}

		var customer = new Customer
		{
			Name = createCustomerDto.Name,
			Email = createCustomerDto.Email,
			Phone = createCustomerDto.Phone,
			CreatedAt = DateTime.UtcNow
		};

		var createdCustomer = await _customerRepository.AddAsync(customer);
		return MapToDto(createdCustomer);
	}

	public async Task UpdateAsync(int id, CreateCustomerDto updateCustomerDto)
	{
		var customer = await _customerRepository.GetByIdAsync(id);
		if (customer == null)
		{
			throw new KeyNotFoundException("Customer not found.");
		}

		// Check if email is being changed to an existing email
		if (customer.Email != updateCustomerDto.Email &&
			await _customerRepository.EmailExistsAsync(updateCustomerDto.Email))
		{
			throw new InvalidOperationException("A customer with this email already exists.");
		}

		customer.Name = updateCustomerDto.Name;
		customer.Email = updateCustomerDto.Email;
		customer.Phone = updateCustomerDto.Phone;
		customer.UpdatedAt = DateTime.UtcNow;

		await _customerRepository.UpdateAsync(customer);
	}

	public async Task DeleteAsync(int id)
	{
		if (!await _customerRepository.ExistsAsync(id))
		{
			throw new KeyNotFoundException("Customer not found.");
		}

		await _customerRepository.DeleteAsync(id);
	}

	private static CustomerDto MapToDto(Customer customer)
	{
		return new CustomerDto
		{
			Id = customer.Id,
			Name = customer.Name,
			Email = customer.Email,
			Phone = customer.Phone,
			CreatedAt = customer.CreatedAt
		};
	}
}
