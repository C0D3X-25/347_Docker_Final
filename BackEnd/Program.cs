var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

// In-memory user store for demo purposes
var users = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

app.MapPost("/users", (UserDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Password))
    {
        return Results.BadRequest(new { message = "Name and password are required." });
    }
    if (users.ContainsKey(dto.Name))
    {
        return Results.Conflict(new { message = "User already exists." });
    }
    users[dto.Name] = dto.Password;
    return Results.Created($"/users/{dto.Name}", new { name = dto.Name });
});

app.MapGet("/users/{name}", (string name) =>
{
    if (string.IsNullOrWhiteSpace(name) || !users.TryGetValue(name, out var password))
    {
        return Results.NotFound(new { message = "User not found." });
    }
    return Results.Ok(new { name, hasPassword = !string.IsNullOrEmpty(password) });
});

app.MapPost("/login", (UserDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Password))
    {
        return Results.BadRequest(new { message = "Name and password are required." });
    }
    if (users.TryGetValue(dto.Name, out var stored) && stored == dto.Password)
    {
        // Return a naive session token placeholder
        return Results.Ok(new { message = "Login successful", token = Guid.NewGuid().ToString("N") });
    }
    return Results.Unauthorized();
});

app.Run();

internal record UserDto(string Name, string Password);
