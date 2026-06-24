namespace Bookify.Application.DTOs;

public class CreateBookingDto
{
	public int CustomerId { get; set; }
	public int ResourceId { get; set; }
	public DateTime StartDate { get; set; }
	public DateTime EndDate { get; set; }
}
