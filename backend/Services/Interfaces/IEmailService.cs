namespace QuickTransit.API.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendWelcomeEmailAsync(string toEmail, string toName, string employeeId, string temporaryPassword);
        Task SendPasswordResetEmailAsync(string toEmail, string toName, string temporaryPassword);
    }
}