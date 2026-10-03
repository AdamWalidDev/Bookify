using Bookify.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Bookify.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
	public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
		: base(options)
	{
	}

	public DbSet<Booking> Bookings => Set<Booking>();
	public DbSet<Customer> Customers => Set<Customer>();
	public DbSet<Resource> Resources => Set<Resource>();

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		base.OnModelCreating(modelBuilder);

		// Booking configuration
		modelBuilder.Entity<Booking>(entity =>
		{
			entity.HasKey(e => e.Id);
			entity.Property(e => e.Status).HasConversion<string>();

			entity.HasOne(e => e.Customer)
				.WithMany(c => c.Bookings)
				.HasForeignKey(e => e.CustomerId)
				.OnDelete(DeleteBehavior.Restrict);

			entity.HasOne(e => e.Resource)
				.WithMany(r => r.Bookings)
				.HasForeignKey(e => e.ResourceId)
				.OnDelete(DeleteBehavior.Restrict);
		});

		// Customer configuration
		modelBuilder.Entity<Customer>(entity =>
		{
			entity.HasKey(e => e.Id);
			entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
			entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
			entity.HasIndex(e => e.Email).IsUnique();
			entity.Property(e => e.Phone).HasMaxLength(20);
		});

		// Resource configuration
		modelBuilder.Entity<Resource>(entity =>
		{
			entity.HasKey(e => e.Id);
			entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
			entity.Property(e => e.Description).HasMaxLength(500);
		});
	}
}
