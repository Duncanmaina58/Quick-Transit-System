namespace QuickTransit.API.Services.Interfaces
{
    public interface INotificationService
    {
        Task SendUserCredentialsEmailAsync(string email, string firstName, string temporaryPassword);
        Task SendUserCredentialsSmsAsync(string phoneNumber, string firstName, string temporaryPassword);
        Task SendPasswordResetEmailAsync(string email, string firstName, string temporaryPassword);
    }
}