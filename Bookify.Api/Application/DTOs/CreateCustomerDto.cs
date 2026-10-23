using System.ComponentModel.DataAnnotations;

namespace Bookify.Application.DTOs;

public class CreateCustomerDto
{
	[Required, StringLength(100)]
	public string Name { get; set; } = string.Empty;

	[Required, EmailAddress, StringLength(100)]
	public string Email { get; set; } = string.Empty;

	[StringLength(20)]
	public string Phone { get; set; } = string.Empty;
}
