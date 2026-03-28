using System.Text;
using System.Text.Json;
using QuickTransit.API.Services.Interfaces;

namespace QuickTransit.API.Services.Implementations
{
    public class BrevoEmailService : IEmailService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;
        private readonly ILogger<BrevoEmailService> _logger;

        public BrevoEmailService(IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<BrevoEmailService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _config = config;
            _logger = logger;
        }

        public async Task SendWelcomeEmailAsync(string toEmail, string toName, string employeeId, string temporaryPassword)
        {
            var appUrl = _config["App:BaseUrl"] ?? "http://localhost:3000";

            var payload = new
            {
                sender = new
                {
                    name = "QuickTransit",
                    email = _config["Brevo:SenderEmail"] ?? "noreply@quicktransit.app"
                },
                to = new[] { new { email = toEmail, name = toName } },
                subject = "Welcome to QuickTransit – Your Login Credentials",
                htmlContent = BuildWelcomeHtml(toName, toEmail, employeeId, temporaryPassword, appUrl)
            };

            await SendAsync(payload);
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string temporaryPassword)
        {
            var appUrl = _config["App:BaseUrl"] ?? "http://localhost:3000";

            var payload = new
            {
                sender = new
                {
                    name = "QuickTransit",
                    email = _config["Brevo:SenderEmail"] ?? "noreply@quicktransit.app"
                },
                to = new[] { new { email = toEmail, name = toName } },
                subject = "QuickTransit – Your Password Has Been Reset",
                htmlContent = BuildPasswordResetHtml(toName, toEmail, temporaryPassword, appUrl)
            };

            await SendAsync(payload);
        }

        private async Task SendAsync(object payload)
        {
            var client = _httpClientFactory.CreateClient("Brevo");
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync("v3/smtp/email", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Brevo API error: {StatusCode} - {Error}", response.StatusCode, error);
                throw new Exception($"Email delivery failed. Please try again later.");
            }

            _logger.LogInformation("Email sent successfully to {Email}", payload
                .GetType().GetProperty("to")?.GetValue(payload));
        }

        private string BuildWelcomeHtml(string name, string email, string employeeId, string password, string appUrl) => $"""
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:36px 40px;text-align:center;">
                        <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">🚌 QuickTransit</h1>
                        <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Public Transport Management System</p>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px;">
                        <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;">Welcome aboard, {name}! 👋</h2>
                        <p style="color:#64748b;margin:0 0 28px;line-height:1.6;">Your QuickTransit account has been created. Below are your login credentials — keep them safe and do not share them.</p>

                        <!-- Credentials Box -->
                        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:24px;margin-bottom:24px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                                <span style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Employee ID</span><br>
                                <span style="color:#1e293b;font-size:18px;font-weight:700;font-family:monospace;">{employeeId}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                                <span style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email Address</span><br>
                                <span style="color:#1e293b;font-size:16px;font-family:monospace;">{email}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0 0;">
                                <span style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Temporary Password</span><br>
                                <span style="color:#1e293b;font-size:18px;font-weight:700;font-family:monospace;background:#fef3c7;padding:4px 10px;border-radius:6px;display:inline-block;margin-top:4px;">{password}</span>
                              </td>
                            </tr>
                          </table>
                        </div>

                        <!-- Warning -->
                        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:28px;display:flex;align-items:flex-start;">
                          <span style="font-size:18px;margin-right:10px;">⚠️</span>
                          <p style="margin:0;color:#dc2626;font-size:14px;line-height:1.5;"><strong>You will be required to change your password on first login.</strong> This temporary password expires after 24 hours.</p>
                        </div>

                        <!-- CTA Button -->
                        <div style="text-align:center;margin-bottom:32px;">
                          <a href="{appUrl}/login" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.3px;">Login to QuickTransit →</a>
                        </div>

                        <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">If you did not expect this email, please contact your SACCO manager immediately.</p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
                        <p style="margin:0;color:#94a3b8;font-size:12px;">© {DateTime.UtcNow.Year} QuickTransit. All rights reserved.</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

        private string BuildPasswordResetHtml(string name, string email, string password, string appUrl) => $"""
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:36px 40px;text-align:center;">
                        <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">🔐 Password Reset</h1>
                        <p style="margin:8px 0 0;color:#fecaca;font-size:14px;">QuickTransit – Public Transport Management System</p>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px;">
                        <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;">Hi {name},</h2>
                        <p style="color:#64748b;margin:0 0 28px;line-height:1.6;">An administrator has reset your password. Use the credentials below to log in and set a new password.</p>

                        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:24px;margin-bottom:24px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                                <span style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email Address</span><br>
                                <span style="color:#1e293b;font-size:16px;font-family:monospace;">{email}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0 0;">
                                <span style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Temporary Password</span><br>
                                <span style="color:#1e293b;font-size:18px;font-weight:700;font-family:monospace;background:#fef3c7;padding:4px 10px;border-radius:6px;display:inline-block;margin-top:4px;">{password}</span>
                              </td>
                            </tr>
                          </table>
                        </div>

                        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:28px;">
                          <p style="margin:0;color:#dc2626;font-size:14px;line-height:1.5;">⚠️ <strong>You must change your password immediately after login.</strong> This link is valid for 24 hours.</p>
                        </div>

                        <div style="text-align:center;margin-bottom:32px;">
                          <a href="{appUrl}/login" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;">Login & Change Password →</a>
                        </div>

                        <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">If you did not request this reset, contact your SACCO manager or system administrator immediately.</p>
                      </td>
                    </tr>

                    <tr>
                      <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
                        <p style="margin:0;color:#94a3b8;font-size:12px;">© {DateTime.UtcNow.Year} QuickTransit. All rights reserved.</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;
    }
}