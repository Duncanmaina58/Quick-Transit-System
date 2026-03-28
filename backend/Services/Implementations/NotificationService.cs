using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(ILogger<NotificationService> logger)
        {
            _logger = logger;
        }

        public async Task SendUserCredentialsEmailAsync(string email, string firstName, string temporaryPassword)
        {
            // TODO: Integrate with actual email service (SendGrid, Mailgun, etc.)
            // For now, log the email that would be sent
            _logger.LogInformation("📧 [EMAIL] To: {Email}, Subject: Your QuickTransit Account Credentials", email);
            _logger.LogInformation($"Dear {firstName},\n\nYour QuickTransit account has been created.\n\nTemporary Password: {temporaryPassword}\n\nPlease login and change your password immediately.\n\nLogin URL: http://localhost:3000/login\n\nBest regards,\nQuickTransit Team");
            
            await Task.CompletedTask;
        }

        public async Task SendUserCredentialsSmsAsync(string phoneNumber, string firstName, string temporaryPassword)
        {
            // TODO: Integrate with actual SMS service (Twilio, AfricasTalking, etc.)
            _logger.LogInformation("📱 [SMS] To: {PhoneNumber}", phoneNumber);
            _logger.LogInformation($"Hi {firstName}, your QuickTransit account is ready. Temp password: {temporaryPassword}. Login at http://localhost:3000/login");
            
            await Task.CompletedTask;
        }

        public async Task SendPasswordResetEmailAsync(string email, string firstName, string temporaryPassword)
        {
            _logger.LogInformation("📧 [PASSWORD RESET] To: {Email}", email);
            _logger.LogInformation($"Dear {firstName},\n\nYour password has been reset.\n\nNew Temporary Password: {temporaryPassword}\n\nPlease login and change your password immediately.\n\nLogin URL: http://localhost:3000/login\n\nBest regards,\nQuickTransit Team");
            
            await Task.CompletedTask;
        }
    }
}