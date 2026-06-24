namespace Bookify.Application.DTOs;

public class CreateResourceDto
{
	public string Name { get; set; } = string.Empty;
	public string Description { get; set; } = string.Empty;
	public int Capacity { get; set; }
	public bool IsAvailable { get; set; }
}
