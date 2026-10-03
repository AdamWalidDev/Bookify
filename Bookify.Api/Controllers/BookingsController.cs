using Bookify.Application.DTOs;
using Bookify.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Bookify.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
	private readonly IBookingService _bookingService;

	public BookingsController(IBookingService bookingService)
	{
		_bookingService = bookingService;
	}

	[HttpGet]
	public async Task<ActionResult<IEnumerable<BookingDto>>> GetAll()
	{
		var bookings = await _bookingService.GetAllAsync();
		return Ok(bookings);
	}

	[HttpGet("{id}")]
	public async Task<ActionResult<BookingDto>> GetById(int id)
	{
		var booking = await _bookingService.GetByIdAsync(id);
		if (booking == null)
		{
			return NotFound();
		}
		return Ok(booking);
	}

	[HttpGet("customer/{customerId}")]
	public async Task<ActionResult<IEnumerable<BookingDto>>> GetByCustomerId(int customerId)
	{
		var bookings = await _bookingService.GetByCustomerIdAsync(customerId);
		return Ok(bookings);
	}

	[HttpGet("resource/{resourceId}")]
	public async Task<ActionResult<IEnumerable<BookingDto>>> GetByResourceId(int resourceId)
	{
		var bookings = await _bookingService.GetByResourceIdAsync(resourceId);
		return Ok(bookings);
	}

	[HttpGet("upcoming")]
	public async Task<ActionResult<IEnumerable<BookingDto>>> GetUpcoming()
	{
		var bookings = await _bookingService.GetUpcomingBookingsAsync();
		return Ok(bookings);
	}

	[HttpGet("check-availability")]
	public async Task<ActionResult<bool>> CheckAvailability(
		[FromQuery] int resourceId,
		[FromQuery] DateTime startDate,
		[FromQuery] DateTime endDate,
		[FromQuery] int? excludeBookingId = null)
	{
		var isAvailable = await _bookingService.IsResourceAvailableAsync(resourceId, startDate, endDate, excludeBookingId);
		return Ok(new { isAvailable });
	}

	[HttpPost]
	public async Task<ActionResult<BookingDto>> Create([FromBody] CreateBookingDto createBookingDto)
	{
		try
		{
			var booking = await _bookingService.CreateAsync(createBookingDto);
			return CreatedAtAction(nameof(GetById), new { id = booking.Id }, booking);
		}
		catch (ArgumentException ex)
		{
			return BadRequest(ex.Message);
		}
		catch (InvalidOperationException ex)
		{
			return Conflict(ex.Message);
		}
	}

	[HttpPut("{id}")]
	public async Task<IActionResult> Update(int id, [FromBody] UpdateBookingDto updateBookingDto)
	{
		try
		{
			await _bookingService.UpdateAsync(id, updateBookingDto);
			return NoContent();
		}
		catch (KeyNotFoundException)
		{
			return NotFound();
		}
		catch (ArgumentException ex)
		{
			return BadRequest(ex.Message);
		}
		catch (InvalidOperationException ex)
		{
			return Conflict(ex.Message);
		}
	}

	[HttpDelete("{id}")]
	public async Task<IActionResult> Delete(int id)
	{
		try
		{
			await _bookingService.DeleteAsync(id);
			return NoContent();
		}
		catch (KeyNotFoundException)
		{
			return NotFound();
		}
	}
}
