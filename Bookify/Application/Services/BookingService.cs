using Bookify.Application.DTOs;
using Bookify.Application.Interfaces;
using Bookify.Domain.Entities;
using Bookify.Domain.Enums;
using Bookify.Domain.Interfaces;

namespace Bookify.Application.Services;

public class BookingService : IBookingService
{
	private readonly IBookingRepository _bookingRepository;
	private readonly ICustomerRepository _customerRepository;
	private readonly IResourceRepository _resourceRepository;

	public BookingService(
		IBookingRepository bookingRepository,
		ICustomerRepository customerRepository,
		IResourceRepository resourceRepository)
	{
		_bookingRepository = bookingRepository;
		_customerRepository = customerRepository;
		_resourceRepository = resourceRepository;
	}

	public async Task<BookingDto?> GetByIdAsync(int id)
	{
		var booking = await _bookingRepository.GetByIdAsync(id);
		return booking == null ? null : MapToDto(booking);
	}

	public async Task<IEnumerable<BookingDto>> GetAllAsync()
	{
		var bookings = await _bookingRepository.GetAllAsync();
		return bookings.Select(MapToDto);
	}

	public async Task<IEnumerable<BookingDto>> GetByCustomerIdAsync(int customerId)
	{
		var bookings = await _bookingRepository.GetByCustomerIdAsync(customerId);
		return bookings.Select(MapToDto);
	}

	public async Task<IEnumerable<BookingDto>> GetByResourceIdAsync(int resourceId)
	{
		var bookings = await _bookingRepository.GetByResourceIdAsync(resourceId);
		return bookings.Select(MapToDto);
	}

	public async Task<IEnumerable<BookingDto>> GetUpcomingBookingsAsync()
	{
		var bookings = await _bookingRepository.GetUpcomingBookingsAsync();
		return bookings.Select(MapToDto);
	}

	public async Task<BookingDto> CreateAsync(CreateBookingDto createBookingDto)
	{
		// Validate customer exists
		if (!await _customerRepository.ExistsAsync(createBookingDto.CustomerId))
		{
			throw new ArgumentException("Customer not found.");
		}

		// Validate resource exists
		if (!await _resourceRepository.ExistsAsync(createBookingDto.ResourceId))
		{
			throw new ArgumentException("Resource not found.");
		}

		// Validate dates
		if (createBookingDto.StartDate >= createBookingDto.EndDate)
		{
			throw new ArgumentException("Start date must be before end date.");
		}

		if (createBookingDto.StartDate < DateTime.Now)
		{
			throw new ArgumentException("Start date cannot be in the past.");
		}

		// Check resource availability
		if (!await _bookingRepository.IsResourceAvailableAsync(
			createBookingDto.ResourceId,
			createBookingDto.StartDate,
			createBookingDto.EndDate))
		{
			throw new InvalidOperationException("Resource is not available for the selected dates.");
		}

		var booking = new Booking
		{
			CustomerId = createBookingDto.CustomerId,
			ResourceId = createBookingDto.ResourceId,
			StartDate = createBookingDto.StartDate,
			EndDate = createBookingDto.EndDate,
			Status = BookingStatus.Pending,
			CreatedAt = DateTime.UtcNow
		};

		var createdBooking = await _bookingRepository.AddAsync(booking);
		return MapToDto(createdBooking);
	}

	public async Task UpdateAsync(int id, UpdateBookingDto updateBookingDto)
	{
		var booking = await _bookingRepository.GetByIdAsync(id);
		if (booking == null)
		{
			throw new KeyNotFoundException("Booking not found.");
		}

		// Validate dates
		if (updateBookingDto.StartDate >= updateBookingDto.EndDate)
		{
			throw new ArgumentException("Start date must be before end date.");
		}

		// Check resource availability (excluding current booking)
		if (!await _bookingRepository.IsResourceAvailableAsync(
			booking.ResourceId,
			updateBookingDto.StartDate,
			updateBookingDto.EndDate,
			id))
		{
			throw new InvalidOperationException("Resource is not available for the selected dates.");
		}

		booking.StartDate = updateBookingDto.StartDate;
		booking.EndDate = updateBookingDto.EndDate;
		booking.Status = Enum.Parse<BookingStatus>(updateBookingDto.Status);
		booking.UpdatedAt = DateTime.UtcNow;

		await _bookingRepository.UpdateAsync(booking);
	}

	public async Task DeleteAsync(int id)
	{
		if (!await _bookingRepository.ExistsAsync(id))
		{
			throw new KeyNotFoundException("Booking not found.");
		}

		await _bookingRepository.DeleteAsync(id);
	}

	public async Task<bool> IsResourceAvailableAsync(int resourceId, DateTime startDate, DateTime endDate, int? excludeBookingId = null)
	{
		return await _bookingRepository.IsResourceAvailableAsync(resourceId, startDate, endDate, excludeBookingId);
	}

	private static BookingDto MapToDto(Booking booking)
	{
		return new BookingDto
		{
			Id = booking.Id,
			CustomerId = booking.CustomerId,
			CustomerName = booking.Customer?.Name ?? string.Empty,
			ResourceId = booking.ResourceId,
			ResourceName = booking.Resource?.Name ?? string.Empty,
			StartDate = booking.StartDate,
			EndDate = booking.EndDate,
			Status = booking.Status.ToString(),
			CreatedAt = booking.CreatedAt
		};
	}
}
