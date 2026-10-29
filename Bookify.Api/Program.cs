using Bookify.Application.Interfaces;
using Bookify.Application.Services;
using Bookify.Domain.Entities;
using Bookify.Domain.Enums;
using Bookify.Domain.Interfaces;
using Bookify.Infrastructure.Data;
using Bookify.Infrastructure.Repositories;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using Scalar.AspNetCore;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

var allowedOrigins = (builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
	.Select(o => o.Trim().TrimEnd('/'))
	.Where(o => !string.IsNullOrEmpty(o))
	.ToArray();
builder.Services.AddCors(options =>
{
	options.AddPolicy("ReactFrontend", policy =>
	{
		if (allowedOrigins.Contains("*"))
		{
			policy.AllowAnyOrigin()
				.AllowAnyHeader()
				.AllowAnyMethod();
		}
		else
		{
			policy.WithOrigins(allowedOrigins)
				.AllowAnyHeader()
				.AllowAnyMethod();
		}
	});
});
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
{
	throw new InvalidOperationException("Jwt:Key must be set and at least 32 characters long.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
	.AddJwtBearer(options =>
	{
		options.TokenValidationParameters = new TokenValidationParameters
		{
			ValidateIssuer = true,
			ValidIssuer = builder.Configuration["Jwt:Issuer"],
			ValidateAudience = true,
			ValidAudience = builder.Configuration["Jwt:Issuer"],
			ValidateLifetime = true,
			ValidateIssuerSigningKey = true,
			IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
		};
	});
builder.Services.AddAuthorization();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
var isEndToEndTest = builder.Environment.IsEnvironment("E2E");
var rawConnectionString = isEndToEndTest
	? "Data Source=bookify-e2e;Mode=Memory;Cache=Shared"
	: builder.Configuration.GetConnectionString("DefaultConnection")
	?? builder.Configuration["DATABASE_URL"]
	?? throw new InvalidOperationException("Connection string 'DefaultConnection' or 'DATABASE_URL' is not configured.");

// Keep a fresh, shared in-memory database alive for this test server's lifetime.
// The E2E environment never opens the configured application database.
using var testDatabase = isEndToEndTest ? new SqliteConnection(rawConnectionString) : null;
testDatabase?.Open();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
	if (isEndToEndTest)
	{
		options.UseSqlite(rawConnectionString);
	}
	else if (IsPostgresConnectionString(rawConnectionString))
	{
		options.UseNpgsql(NormalizePostgresConnectionString(rawConnectionString));
	}
	else
	{
		options.UseSqlServer(rawConnectionString);
	}
});

builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<IResourceRepository, ResourceRepository>();
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IResourceService, ResourceService>();
builder.Services.AddScoped<IBookingService, BookingService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
	var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
	if (dbContext.Database.IsSqlServer())
	{
		dbContext.Database.Migrate();
	}
	else
	{
		dbContext.Database.EnsureCreated();
	}

	SeedDemoDataIfEmpty(dbContext);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
	app.MapScalarApiReference();
	app.MapOpenApi();
}

if (!isEndToEndTest)
{
	app.UseHttpsRedirection();
}

app.UseCors("ReactFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static void SeedDemoDataIfEmpty(ApplicationDbContext dbContext)
{
	if (dbContext.Resources.Any() || dbContext.Customers.Any())
	{
		return;
	}

	var now = DateTime.UtcNow;

	var resources = new[]
	{
		new Resource
		{
			Name = "Nordic Boardroom",
			Description = "12-seat executive conference room with dual 4K displays and video conferencing.",
			Capacity = 12,
			IsAvailable = true,
			CreatedAt = now
		},
		new Resource
		{
			Name = "Atelier Workshop Studio",
			Description = "Open collaborative studio with movable whiteboards, projector, and modular seating.",
			Capacity = 20,
			IsAvailable = true,
			CreatedAt = now
		},
		new Resource
		{
			Name = "Focus Pod B",
			Description = "Soundproof acoustic pod for quiet calls and 1-on-1 interviews.",
			Capacity = 2,
			IsAvailable = true,
			CreatedAt = now
		},
		new Resource
		{
			Name = "Rooftop Lounge",
			Description = "Event terrace currently undergoing seasonal AV maintenance.",
			Capacity = 40,
			IsAvailable = false,
			CreatedAt = now
		},
		new Resource
		{
			Name = "Project Room C",
			Description = "Six-person project room with a whiteboard wall and wireless screen sharing.",
			Capacity = 6,
			IsAvailable = true,
			CreatedAt = now
		},
		new Resource
		{
			Name = "Podcast Studio",
			Description = "Acoustically treated studio with four microphones, headphones, and a recording desk.",
			Capacity = 4,
			IsAvailable = true,
			CreatedAt = now
		}
	};

	var customers = new[]
	{
		new Customer
		{
			Name = "Emma Lindqvist",
			Email = "emma.lindqvist@example.com",
			Phone = "+46 70 123 45 67",
			CreatedAt = now
		},
		new Customer
		{
			Name = "Marcus Vance",
			Email = "marcus.vance@example.com",
			Phone = "+1 (555) 234-8910",
			CreatedAt = now
		},
		new Customer
		{
			Name = "Sofia Chen",
			Email = "sofia.chen@example.com",
			Phone = "+44 20 7946 0921",
			CreatedAt = now
		}
	};

	dbContext.Resources.AddRange(resources);
	dbContext.Customers.AddRange(customers);
	dbContext.SaveChanges();

	var tomorrow = now.Date.AddDays(1);
	var bookings = new[]
	{
		new Booking
		{
			CustomerId = customers[0].Id,
			ResourceId = resources[0].Id,
			StartDate = tomorrow.AddHours(9),
			EndDate = tomorrow.AddHours(11),
			Status = BookingStatus.Confirmed,
			CreatedAt = now
		},
		new Booking
		{
			CustomerId = customers[0].Id,
			ResourceId = resources[4].Id,
			StartDate = tomorrow.AddHours(14),
			EndDate = tomorrow.AddHours(15),
			Status = BookingStatus.Pending,
			CreatedAt = now
		},
		new Booking
		{
			CustomerId = customers[1].Id,
			ResourceId = resources[5].Id,
			StartDate = tomorrow.AddDays(2).AddHours(10),
			EndDate = tomorrow.AddDays(2).AddHours(12),
			Status = BookingStatus.Cancelled,
			CreatedAt = now
		},
		new Booking
		{
			CustomerId = customers[2].Id,
			ResourceId = resources[0].Id,
			StartDate = now.Date.AddDays(-1).AddHours(9),
			EndDate = now.Date.AddDays(-1).AddHours(11),
			Status = BookingStatus.Completed,
			CreatedAt = now.AddDays(-2)
		},
		new Booking
		{
			CustomerId = customers[1].Id,
			ResourceId = resources[1].Id,
			StartDate = tomorrow.AddHours(13),
			EndDate = tomorrow.AddHours(16),
			Status = BookingStatus.Pending,
			CreatedAt = now
		},
		new Booking
		{
			CustomerId = customers[2].Id,
			ResourceId = resources[2].Id,
			StartDate = tomorrow.AddDays(1).AddHours(10),
			EndDate = tomorrow.AddDays(1).AddHours(11),
			Status = BookingStatus.Confirmed,
			CreatedAt = now
		}
	};

	dbContext.Bookings.AddRange(bookings);
	dbContext.SaveChanges();
}

static bool IsPostgresConnectionString(string connectionString) =>
	connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
	connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) ||
	connectionString.Contains("Host=", StringComparison.OrdinalIgnoreCase);

static string NormalizePostgresConnectionString(string connectionString)
{
	if (!connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
		!connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
	{
		return connectionString;
	}

	var uri = new Uri(connectionString);
	var userInfo = uri.UserInfo.Split(':', 2);
	var builder = new NpgsqlConnectionStringBuilder
	{
		Host = uri.Host,
		Port = uri.Port > 0 ? uri.Port : 5432,
		Database = uri.AbsolutePath.Trim('/'),
		Username = Uri.UnescapeDataString(userInfo[0]),
		Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
		SslMode = SslMode.Prefer
	};
	return builder.ConnectionString;
}
