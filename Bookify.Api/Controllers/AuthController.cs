using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace Bookify.Controllers;

public record LoginRequest(string Username, string Password);

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
	private readonly IConfiguration _configuration;

	public AuthController(IConfiguration configuration)
	{
		_configuration = configuration;
	}

	[HttpPost("login")]
	public IActionResult Login([FromBody] LoginRequest request)
	{
		var username = _configuration["Admin:Username"] ?? string.Empty;
		var password = _configuration["Admin:Password"] ?? string.Empty;

		if (username.Length == 0 || password.Length == 0 ||
			!IsSame(request.Username, username) || !IsSame(request.Password, password))
		{
			return Unauthorized("Invalid username or password.");
		}

		var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
		var token = new JwtSecurityToken(
			issuer: _configuration["Jwt:Issuer"],
			audience: _configuration["Jwt:Issuer"],
			claims: [new Claim(ClaimTypes.Name, username)],
			expires: DateTime.UtcNow.AddHours(8),
			signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

		return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
	}

	// Hash first so both values have the same length for the constant-time compare.
	private static bool IsSame(string? input, string expected)
	{
		var a = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? string.Empty));
		var b = SHA256.HashData(Encoding.UTF8.GetBytes(expected));
		return CryptographicOperations.FixedTimeEquals(a, b);
	}
}
