namespace Bookify.Application.DTOs;

public class UpdateBookingDto
{
	public DateTime StartDate { get; set; }
	public DateTime EndDate { get; set; }
	public string Status { get; set; } = string.Empty;
}
