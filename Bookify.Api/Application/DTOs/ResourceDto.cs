namespace Bookify.Application.DTOs;

public class ResourceDto
{
	public int Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public string Description { get; set; } = string.Empty;
	public int Capacity { get; set; }
	public bool IsAvailable { get; set; }
	public DateTime CreatedAt { get; set; }
}
