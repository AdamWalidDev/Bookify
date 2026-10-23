using Bookify.Application.Interfaces;
using Bookify.Application.Services;
using Bookify.Domain.Interfaces;
using Bookify.Infrastructure.Data;
using Bookify.Infrastructure.Repositories;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
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
var rawConnectionString = builder.Configuration.GetConnectionString("DefaultConnection")
	?? builder.Configuration["DATABASE_URL"]
	?? throw new InvalidOperationException("Connection string 'DefaultConnection' or 'DATABASE_URL' is not configured.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
	if (IsPostgresConnectionString(rawConnectionString))
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
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
	app.MapScalarApiReference();
	app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("ReactFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

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
