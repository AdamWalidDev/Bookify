namespace Bookify.Domain.Entities;

public class Resource
{
	public int Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public string Description { get; set; } = string.Empty;
	public int Capacity { get; set; }
	public bool IsAvailable { get; set; }
	public DateTime CreatedAt { get; set; }
	public DateTime? UpdatedAt { get; set; }

	// Navigation properties
	public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
