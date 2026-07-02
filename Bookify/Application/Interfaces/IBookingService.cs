using Bookify.Application.DTOs;

namespace Bookify.Application.Interfaces;

public interface IBookingService
{
	Task<BookingDto?> GetByIdAsync(int id);
	Task<IEnumerable<BookingDto>> GetAllAsync();
	Task<IEnumerable<BookingDto>> GetByCustomerIdAsync(int customerId);
	Task<IEnumerable<BookingDto>> GetByResourceIdAsync(int resourceId);
	Task<IEnumerable<BookingDto>> GetUpcomingBookingsAsync();
	Task<BookingDto> CreateAsync(CreateBookingDto createBookingDto);
	Task UpdateAsync(int id, UpdateBookingDto updateBookingDto);
	Task DeleteAsync(int id);
	Task<bool> IsResourceAvailableAsync(int resourceId, DateTime startDate, DateTime endDate, int? excludeBookingId = null);
}
