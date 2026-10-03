namespace Bookify.Application.DTOs;

public class BookingDto
{
	public int Id { get; set; }
	public int CustomerId { get; set; }
	public string CustomerName { get; set; } = string.Empty;
	public int ResourceId { get; set; }
	public string ResourceName { get; set; } = string.Empty;
	public DateTime StartDate { get; set; }
	public DateTime EndDate { get; set; }
	public string Status { get; set; } = string.Empty;
	public DateTime CreatedAt { get; set; }
}
