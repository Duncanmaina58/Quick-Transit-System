namespace QuickTransit.API.Models.DTOs
{
    public class PostLocationRequest
    {
        public decimal Latitude  { get; set; }
        public decimal Longitude { get; set; }
        public decimal? Speed    { get; set; }   // km/h
        public decimal? Heading  { get; set; }   // degrees 0-360
        public decimal? Accuracy { get; set; }   // metres
    }

    public class VehicleLocationResponse
    {
        public Guid     TripId            { get; set; }
        public Guid     VehicleId         { get; set; }
        public string   RegistrationPlate { get; set; } = string.Empty;
        public string   DriverName        { get; set; } = string.Empty;
        public string?  ConductorName     { get; set; }
        public string   RouteCode         { get; set; } = string.Empty;
        public string   RouteName         { get; set; } = string.Empty;
        public string   Origin            { get; set; } = string.Empty;
        public string   Destination       { get; set; } = string.Empty;
        public decimal  Latitude          { get; set; }
        public decimal  Longitude         { get; set; }
        public decimal? Speed             { get; set; }
        public decimal? Heading           { get; set; }
        public int      CurrentPassengers { get; set; }
        public int      VehicleCapacity   { get; set; }
        public bool     IsOverloaded      { get; set; }
        public string   TripStatus        { get; set; } = string.Empty;
        public DateTime LastUpdated       { get; set; }
        public string   ElapsedTime       { get; set; } = string.Empty;
    }

    public class TripLocationPointResponse
    {
        public decimal  Latitude  { get; set; }
        public decimal  Longitude { get; set; }
        public decimal? Speed     { get; set; }
        public decimal? Heading   { get; set; }
        public DateTime RecordedAt { get; set; }
    }
}