using Bookify.Domain.Entities;
using Bookify.Domain.Enums;
using Bookify.Domain.Interfaces;
using Bookify.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Bookify.Infrastructure.Repositories;

public class BookingRepository : Repository<Booking>, IBookingRepository
{
	public BookingRepository(ApplicationDbContext context) : base(context)
	{
	}

	public override async Task<Booking?> GetByIdAsync(int id)
	{
		return await _dbSet
			.Include(b => b.Customer)
			.Include(b => b.Resource)
			.FirstOrDefaultAsync(b => b.Id == id);
	}

	public override async Task<IEnumerable<Booking>> GetAllAsync()
	{
		return await _dbSet
			.Include(b => b.Customer)
			.Include(b => b.Resource)
			.ToListAsync();
	}

	public async Task<IEnumerable<Booking>> GetByCustomerIdAsync(int customerId)
	{
		return await _dbSet
			.Include(b => b.Customer)
			.Include(b => b.Resource)
			.Where(b => b.CustomerId == customerId)
			.ToListAsync();
	}

	public async Task<IEnumerable<Booking>> GetByResourceIdAsync(int resourceId)
	{
		return await _dbSet
			.Include(b => b.Customer)
			.Include(b => b.Resource)
			.Where(b => b.ResourceId == resourceId)
			.ToListAsync();
	}

	public async Task<bool> IsResourceAvailableAsync(int resourceId, DateTime startDate, DateTime endDate, int? excludeBookingId = null)
	{
		var query = _dbSet.Where(b =>
			b.ResourceId == resourceId &&
			b.Status != BookingStatus.Cancelled &&
			((b.StartDate < endDate && b.EndDate > startDate)));

		if (excludeBookingId.HasValue)
		{
			query = query.Where(b => b.Id != excludeBookingId.Value);
		}

		return !await query.AnyAsync();
	}

	public async Task<IEnumerable<Booking>> GetUpcomingBookingsAsync()
	{
		return await _dbSet
			.Include(b => b.Customer)
			.Include(b => b.Resource)
			.Where(b => b.StartDate >= DateTime.Now && b.Status != BookingStatus.Cancelled)
			.OrderBy(b => b.StartDate)
			.ToListAsync();
	}
}
