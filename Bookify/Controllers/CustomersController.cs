using Bookify.Application.DTOs;
using Bookify.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Bookify.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
	private readonly ICustomerService _customerService;

	public CustomersController(ICustomerService customerService)
	{
		_customerService = customerService;
	}

	[HttpGet]
	public async Task<ActionResult<IEnumerable<CustomerDto>>> GetAll()
	{
		var customers = await _customerService.GetAllAsync();
		return Ok(customers);
	}

	[HttpGet("{id}")]
	public async Task<ActionResult<CustomerDto>> GetById(int id)
	{
		var customer = await _customerService.GetByIdAsync(id);
		if (customer == null)
		{
			return NotFound();
		}
		return Ok(customer);
	}

	[HttpGet("email/{email}")]
	public async Task<ActionResult<CustomerDto>> GetByEmail(string email)
	{
		var customer = await _customerService.GetByEmailAsync(email);
		if (customer == null)
		{
			return NotFound();
		}
		return Ok(customer);
	}

	[HttpPost]
	public async Task<ActionResult<CustomerDto>> Create([FromBody] CreateCustomerDto createCustomerDto)
	{
		try
		{
			var customer = await _customerService.CreateAsync(createCustomerDto);
			return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
		}
		catch (InvalidOperationException ex)
		{
			return Conflict(ex.Message);
		}
	}

	[HttpPut("{id}")]
	public async Task<IActionResult> Update(int id, [FromBody] CreateCustomerDto updateCustomerDto)
	{
		try
		{
			await _customerService.UpdateAsync(id, updateCustomerDto);
			return NoContent();
		}
		catch (KeyNotFoundException)
		{
			return NotFound();
		}
		catch (InvalidOperationException ex)
		{
			return Conflict(ex.Message);
		}
	}

	[HttpDelete("{id}")]
	public async Task<IActionResult> Delete(int id)
	{
		try
		{
			await _customerService.DeleteAsync(id);
			return NoContent();
		}
		catch (KeyNotFoundException)
		{
			return NotFound();
		}
	}
}
