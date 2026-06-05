using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QuickTransit.API.Data;
using QuickTransit.API.Services.Implementations;
using QuickTransit.API.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// In Program.cs — add this to your JSON configuration:
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // This makes ALL enums serialize/deserialize as strings
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter()
        );
    });
    
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── JWT ───────────────────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32)
    throw new Exception("JWT Key must be at least 32 characters. Check appsettings.json.");

var key = Encoding.ASCII.GetBytes(jwtKey);
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// ── Brevo Email (HttpClient) ───────────────────────────────────────────────────
builder.Services.AddHttpClient("Brevo", client =>
{
    client.BaseAddress = new Uri("https://api.brevo.com/");
    client.DefaultRequestHeaders.Add("api-key", builder.Configuration["Brevo:ApiKey"]);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// ── Application Services ──────────────────────────────────────────────────────
builder.Services.AddScoped<IEmailService, BrevoEmailService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ISaccoService, SaccoService>();
builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddScoped<IRouteService, RouteService>();
builder.Services.AddScoped<IManagerService, ManagerService>();
builder.Services.AddScoped<ITripService, TripService>();
builder.Services.AddScoped<IAlertService, AlertService>();
builder.Services.AddScoped<IShiftService, ShiftService>();
builder.Services.AddScoped<ILocationService, LocationService>();
// ── CORS ──────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJS", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                builder.Configuration["App:BaseUrl"] ?? "http://localhost:3000"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowNextJS");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ── Seed ──────────────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
                  .GetRequiredService<ApplicationDbContext>();

    await db.Database.MigrateAsync();

    try
    {
        await SeedData.Initialize(scope.ServiceProvider);
    }
    catch (Exception ex)
    {
        scope.ServiceProvider
             .GetRequiredService<ILogger<Program>>()
             .LogError(ex, "Error seeding database.");
    }
}

app.Run();