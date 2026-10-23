using Bookify.Application.DTOs;
using Bookify.Application.Services;
using Bookify.Domain.Entities;
using Bookify.Domain.Enums;
using Bookify.Infrastructure.Data;
using Bookify.Infrastructure.Repositories;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Bookify.Api.Tests;

public class BookingAvailabilityTests
{
	[Fact]
	public async Task CreateAsync_RejectsOverlappingBooking()
	{
		await using var fixture = await BookingFixture.CreateAsync();
		await fixture.AddBookingAsync(BookingStatus.Confirmed);

		var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
			fixture.Service.CreateAsync(fixture.NewBooking()));

		Assert.Contains("not available", exception.Message, StringComparison.OrdinalIgnoreCase);
	}

	[Fact]
	public async Task CreateAsync_AllowsAdjacentBooking()
	{
		await using var fixture = await BookingFixture.CreateAsync();
		await fixture.AddBookingAsync(BookingStatus.Confirmed);
		var request = fixture.NewBooking();
		request.StartDate = fixture.Start.AddHours(1);
		request.EndDate = fixture.Start.AddHours(2);

		var booking = await fixture.Service.CreateAsync(request);

		Assert.Equal(BookingStatus.Pending.ToString(), booking.Status);
	}

	[Theory]
	[InlineData(BookingStatus.Cancelled)]
	[InlineData(BookingStatus.Completed)]
	public async Task CreateAsync_AllowsSlotReservedOnlyByInactiveBooking(BookingStatus status)
	{
		await using var fixture = await BookingFixture.CreateAsync();
		await fixture.AddBookingAsync(status);

		var booking = await fixture.Service.CreateAsync(fixture.NewBooking());

		Assert.Equal(BookingStatus.Pending.ToString(), booking.Status);
	}

	[Fact]
	public async Task CreateAsync_RejectsUnavailableResource()
	{
		await using var fixture = await BookingFixture.CreateAsync(resourceIsAvailable: false);

		await Assert.ThrowsAsync<InvalidOperationException>(() =>
			fixture.Service.CreateAsync(fixture.NewBooking()));
	}

	[Fact]
	public async Task CreateAsync_RejectsInvalidDateRange()
	{
		await using var fixture = await BookingFixture.CreateAsync();
		var request = fixture.NewBooking();
		request.EndDate = request.StartDate;

		await Assert.ThrowsAsync<ArgumentException>(() => fixture.Service.CreateAsync(request));
	}

	[Fact]
	public async Task IsResourceAvailableAsync_ReturnsFalseForUnavailableResource()
	{
		await using var fixture = await BookingFixture.CreateAsync(resourceIsAvailable: false);

		var isAvailable = await fixture.Service.IsResourceAvailableAsync(
			fixture.Resource.Id,
			fixture.Start,
			fixture.Start.AddHours(1));

		Assert.False(isAvailable);
	}

	[Fact]
	public async Task CustomerService_RejectsDuplicateEmail()
	{
		await using var fixture = await BookingFixture.CreateAsync();
		var service = new CustomerService(new CustomerRepository(fixture.Context));

		var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
			service.CreateAsync(new CreateCustomerDto
			{
				Name = "Second Customer",
				Email = fixture.Customer.Email
			}));

		Assert.Contains("email", exception.Message, StringComparison.OrdinalIgnoreCase);
	}

	[Fact]
	public async Task IsResourceAvailableAsync_ReturnsFalseForOverlappingBooking()
	{
		await using var fixture = await BookingFixture.CreateAsync();
		await fixture.AddBookingAsync(BookingStatus.Pending);

		var isAvailable = await fixture.Service.IsResourceAvailableAsync(
			fixture.Resource.Id,
			fixture.Start.AddMinutes(30),
			fixture.Start.AddHours(1).AddMinutes(30));

		Assert.False(isAvailable);
	}

	private sealed class BookingFixture : IAsyncDisposable
	{
		private readonly SqliteConnection _connection;
		private readonly ApplicationDbContext _context;

		private BookingFixture(SqliteConnection connection, ApplicationDbContext context, Customer customer, Resource resource)
		{
			_connection = connection;
			_context = context;
			Customer = customer;
			Resource = resource;
			Service = new BookingService(
				new BookingRepository(context),
				new CustomerRepository(context),
				new ResourceRepository(context));
		}

		public BookingService Service { get; }
		public ApplicationDbContext Context => _context;
		public Customer Customer { get; }
		public Resource Resource { get; }
		public DateTime Start { get; } = DateTime.UtcNow.AddDays(2);

		public static async Task<BookingFixture> CreateAsync(bool resourceIsAvailable = true)
		{
			var connection = new SqliteConnection("Data Source=:memory:");
			await connection.OpenAsync();
			var options = new DbContextOptionsBuilder<ApplicationDbContext>()
				.UseSqlite(connection)
				.Options;
			var context = new ApplicationDbContext(options);
			await context.Database.EnsureCreatedAsync();

			var customer = new Customer
			{
				Name = "Test Customer",
				Email = $"test-{Guid.NewGuid():N}@example.com",
				CreatedAt = DateTime.UtcNow
			};
			var resource = new Resource
			{
				Name = "Test Room",
				Capacity = 4,
				IsAvailable = resourceIsAvailable,
				CreatedAt = DateTime.UtcNow
			};
			context.Customers.Add(customer);
			context.Resources.Add(resource);
			await context.SaveChangesAsync();

			return new BookingFixture(connection, context, customer, resource);
		}

		public CreateBookingDto NewBooking() => new()
		{
			CustomerId = Customer.Id,
			ResourceId = Resource.Id,
			StartDate = Start,
			EndDate = Start.AddHours(1)
		};

		public async Task AddBookingAsync(BookingStatus status)
		{
			var booking = NewBooking();
			_context.Bookings.Add(new Booking
			{
				CustomerId = booking.CustomerId,
				ResourceId = booking.ResourceId,
				StartDate = booking.StartDate,
				EndDate = booking.EndDate,
				Status = status,
				CreatedAt = DateTime.UtcNow
			});
			await _context.SaveChangesAsync();
		}

		public async ValueTask DisposeAsync()
		{
			await _context.DisposeAsync();
			await _connection.DisposeAsync();
		}
	}
}
