using Bookify.Domain.Enums;

namespace Bookify.Domain.Entities
{
	public class Booking
	{
		public int Id { get; set; }
		public int CustomerId { get; set; }
		public int ResourceId { get; set; }
		public DateTime StartDate { get; set; }
		public DateTime EndDate { get; set; }
		public BookingStatus Status { get; set; }
		public DateTime CreatedAt { get; set; }
		public DateTime? UpdatedAt { get; set; }

		// Navigation properties
		public Customer Customer { get; set; }= null!;
		public Resource Resource { get; set; }= null!;
	}
}
