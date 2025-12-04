using MySqlConnector;

var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

// Build MySQL connection string from environment variables
string GetConnectionString()
{
    var host = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
    var port = Environment.GetEnvironmentVariable("DB_PORT") ?? "3306";
    var database = Environment.GetEnvironmentVariable("DB_NAME") ?? "db_347";
    var user = Environment.GetEnvironmentVariable("DB_USER") ?? "appuser";
    var password = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "apppassword";
    return $"Server={host};Port={port};Database={database};User={user};Password={password};";
}

/// <summary>
/// Registers a new user with name and password.
/// POST /users
/// Request body: { "name": "alice", "password": "mypassword" }
/// Response 201: { "name": "alice" }
/// Response 400: { "message": "Name and password are required." }
/// Response 409: { "message": "User already exists." }
/// </summary>
app.MapPost("/users", async (UserDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Password))
    {
        return Results.BadRequest(new { message = "Name and password are required." });
    }

    await using var connection = new MySqlConnection(GetConnectionString());
    await connection.OpenAsync();

    // Check if user already exists
    await using var checkCmd = new MySqlCommand("SELECT COUNT(*) FROM users WHERE name = @name", connection);
    checkCmd.Parameters.AddWithValue("@name", dto.Name);
    var count = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());
    if (count > 0)
    {
        return Results.Conflict(new { message = "User already exists." });
    }

    // Insert new user
    await using var insertCmd = new MySqlCommand("INSERT INTO users (name, password) VALUES (@name, @password)", connection);
    insertCmd.Parameters.AddWithValue("@name", dto.Name);
    insertCmd.Parameters.AddWithValue("@password", dto.Password);
    await insertCmd.ExecuteNonQueryAsync();

    return Results.Created($"/users/{dto.Name}", new { name = dto.Name });
});

/// <summary>
/// Gets a user by name. Returns 404 if not found.
/// GET /users/{name}
/// Response 200: { "name": "alice", "hasPassword": true }
/// Response 404: { "message": "User not found." }
/// </summary>
app.MapGet("/users/{name}", async (string name) =>
{
    if (string.IsNullOrWhiteSpace(name))
    {
        return Results.NotFound(new { message = "User not found." });
    }

    await using var connection = new MySqlConnection(GetConnectionString());
    await connection.OpenAsync();

    await using var cmd = new MySqlCommand("SELECT name, password FROM users WHERE name = @name", connection);
    cmd.Parameters.AddWithValue("@name", name);

    await using var reader = await cmd.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
        var userName = reader.GetString("name");
        var password = reader.GetString("password");
        return Results.Ok(new { name = userName, hasPassword = !string.IsNullOrEmpty(password) });
    }

    return Results.NotFound(new { message = "User not found." });
});

/// <summary>
/// Authenticates a user. Returns a token on success.
/// POST /login
/// Request body: { "name": "alice", "password": "mypassword" }
/// Response 200: { "message": "Login successful", "token": "a1b2c3d4..." }
/// Response 400: { "message": "Name and password are required." }
/// Response 401: Unauthorized (empty body)
/// </summary>
app.MapPost("/login", async (UserDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Password))
    {
        return Results.BadRequest(new { message = "Name and password are required." });
    }

    await using var connection = new MySqlConnection(GetConnectionString());
    await connection.OpenAsync();

    await using var cmd = new MySqlCommand("SELECT id FROM users WHERE name = @name AND password = @password", connection);
    cmd.Parameters.AddWithValue("@name", dto.Name);
    cmd.Parameters.AddWithValue("@password", dto.Password);

    var result = await cmd.ExecuteScalarAsync();
    if (result is not null)
    {
        return Results.Ok(new { message = "Login successful", token = Guid.NewGuid().ToString("N") });
    }

    return Results.Unauthorized();
});

/// <summary>
/// Gets all scores for a specific user.
/// GET /scores/{name}
/// Response 200: { "name": "alice", "scores": [100, 200, 150], "bestScore": 200 }
/// Response 404: { "message": "User not found." }
/// </summary>
app.MapGet("/scores/{name}", async (string name) =>
{
    if (string.IsNullOrWhiteSpace(name))
    {
        return Results.NotFound(new { message = "User not found." });
    }

    await using var connection = new MySqlConnection(GetConnectionString());
    await connection.OpenAsync();

    // Check if user exists
    await using var userCmd = new MySqlCommand("SELECT id FROM users WHERE name = @name", connection);
    userCmd.Parameters.AddWithValue("@name", name);
    var userId = await userCmd.ExecuteScalarAsync();
    if (userId is null)
    {
        return Results.NotFound(new { message = "User not found." });
    }

    // Get all scores for user
    await using var scoresCmd = new MySqlCommand("SELECT score FROM scores WHERE fk_user = @userId ORDER BY created_at DESC", connection);
    scoresCmd.Parameters.AddWithValue("@userId", userId);

    var userScores = new List<int>();
    await using var reader = await scoresCmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        userScores.Add(reader.GetInt32("score"));
    }

    var bestScore = userScores.Count > 0 ? userScores.Max() : 0;
    return Results.Ok(new { name, scores = userScores, bestScore });
});

/// <summary>
/// Gets the leaderboard with best score per user, sorted descending.
/// GET /scores
/// Response 200: [ { "name": "alice", "bestScore": 200 }, { "name": "bob", "bestScore": 150 } ]
/// </summary>
app.MapGet("/scores", async () =>
{
    await using var connection = new MySqlConnection(GetConnectionString());
    await connection.OpenAsync();

    await using var cmd = new MySqlCommand(
        "SELECT u.name, MAX(s.score) AS bestScore FROM scores s " +
        "JOIN users u ON s.fk_user = u.id " +
        "GROUP BY u.id, u.name " +
        "ORDER BY bestScore DESC", connection);

    var leaderboard = new List<object>();
    await using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        leaderboard.Add(new { name = reader.GetString("name"), bestScore = reader.GetInt32("bestScore") });
    }

    return Results.Ok(leaderboard);
});

/// <summary>
/// Saves a new score for a user.
/// POST /scores
/// Request body: { "name": "alice", "score": 250 }
/// Response 201: { "name": "alice", "score": 250 }
/// Response 400: { "message": "Name and score are required." }
/// Response 404: { "message": "User not found." }
/// </summary>
app.MapPost("/scores", async (ScoreDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Name))
    {
        return Results.BadRequest(new { message = "Name and score are required." });
    }

    await using var connection = new MySqlConnection(GetConnectionString());
    await connection.OpenAsync();

    // Get user id
    await using var userCmd = new MySqlCommand("SELECT id FROM users WHERE name = @name", connection);
    userCmd.Parameters.AddWithValue("@name", dto.Name);
    var userId = await userCmd.ExecuteScalarAsync();
    if (userId is null)
    {
        return Results.NotFound(new { message = "User not found." });
    }

    // Insert score
    await using var insertCmd = new MySqlCommand("INSERT INTO scores (fk_user, score) VALUES (@userId, @score)", connection);
    insertCmd.Parameters.AddWithValue("@userId", userId);
    insertCmd.Parameters.AddWithValue("@score", dto.Score);
    await insertCmd.ExecuteNonQueryAsync();

    return Results.Created($"/scores/{dto.Name}", new { name = dto.Name, score = dto.Score });
});

app.Run();

/// <summary>
/// Data transfer object for user registration and login.
/// Properties:
///   - Name: string (required)
///   - Password: string (required)
/// </summary>
internal record UserDto(string Name, string Password);

/// <summary>
/// Data transfer object for saving a score.
/// Properties:
///   - Name: string (required) - the username
///   - Score: int (required) - the score value
/// </summary>
internal record ScoreDto(string Name, int Score);
