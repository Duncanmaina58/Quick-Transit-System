using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickTransit.API.Migrations
{
    /// <inheritdoc />
    public partial class AddLocationTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Accuracy",
                table: "TripLocations",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Heading",
                table: "TripLocations",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Accuracy",
                table: "TripLocations");

            migrationBuilder.DropColumn(
                name: "Heading",
                table: "TripLocations");
        }
    }
}
