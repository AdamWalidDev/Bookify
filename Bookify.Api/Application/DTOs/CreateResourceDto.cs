using System.ComponentModel.DataAnnotations;

namespace Bookify.Application.DTOs;

public class CreateResourceDto
{
	[Required, StringLength(100)]
	public string Name { get; set; } = string.Empty;

	[StringLength(500)]
	public string Description { get; set; } = string.Empty;

	[Range(1, 1000)]
	public int Capacity { get; set; }

	public bool IsAvailable { get; set; }
}
