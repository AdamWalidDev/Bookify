using Bookify.Domain.Entities;

namespace Bookify.Domain.Interfaces;

public interface IBookingRepository : IRepository<Booking>
{
	Task<IEnumerable<Booking>> GetByCustomerIdAsync(int customerId);
	Task<IEnumerable<Booking>> GetByResourceIdAsync(int resourceId);
	Task<bool> IsResourceAvailableAsync(int resourceId, DateTime startDate, DateTime endDate, int? excludeBookingId = null);
	Task<IEnumerable<Booking>> GetUpcomingBookingsAsync();
}
