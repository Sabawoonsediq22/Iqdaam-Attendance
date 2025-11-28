import { Resend } from "resend";

export interface PasswordResetEmailData {
  email: string;
  code: string;
}

export interface NotificationEmailData {
  email: string;
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info" | "class" | "student" | "attendance";
}

export async function sendPasswordResetEmail({ email, code }: PasswordResetEmailData) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: "Attendance App <onboarding@resend.dev>", // Use Resend's testing domain
      to: email,
      subject: "Reset Your Password - Attendance App",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .code-container { background-color: #f8f9fa; border: 2px dashed #e9ecef; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
            .code { font-size: 36px; font-weight: 700; color: #495057; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .message { color: #6c757d; line-height: 1.6; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
            .footer p { color: #6c757d; margin: 0; font-size: 14px; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0; }
            .warning p { color: #856404; margin: 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Reset Your Password</h1>
            </div>

            <div class="content">
              <p class="message">
                We received a request to reset your password for your Attendance App account.
                Use the verification code below to complete the password reset process.
              </p>

              <div class="code-container">
                <div class="code">${code}</div>
              </div>

              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong> This code will expire in 10 minutes for your security.
                If you didn't request this password reset, please ignore this email.</p>
              </div>

              <p class="message">
                Enter this code on the password reset page to continue. The code can only be used once.
              </p>

              <p class="message">
                If you're having trouble copying the code, you can also enter it manually.
              </p>
            </div>

            <div class="footer">
              <p>This is an automated message from Attendance App. Please do not reply to this email.</p>
              <p>If you need help, contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send password reset email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendNotificationEmail({ email, title, message, type }: NotificationEmailData) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }

    // Get notification type color and icon
    const getTypeConfig = (type: string) => {
      switch (type) {
        case "success":
          return { color: "#10b981", icon: "✅" };
        case "error":
          return { color: "#ef4444", icon: "❌" };
        case "warning":
          return { color: "#f59e0b", icon: "⚠️" };
        case "info":
          return { color: "#3b82f6", icon: "ℹ️" };
        case "class":
          return { color: "#8b5cf6", icon: "📚" };
        case "student":
          return { color: "#06b6d4", icon: "👨‍🎓" };
        case "attendance":
          return { color: "#84cc16", icon: "📊" };
        default:
          return { color: "#6b7280", icon: "📢" };
      }
    };

    const { color, icon } = getTypeConfig(type);

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: "Attendance App <onboarding@resend.dev>", // Use Resend's testing domain
      to: email,
      subject: `Attendance App - ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 30px 30px 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
            .icon { font-size: 48px; margin-bottom: 10px; }
            .content { padding: 30px; }
            .message { color: #374151; line-height: 1.6; margin: 20px 0; font-size: 16px; }
            .highlight { background-color: #f3f4f6; border-left: 4px solid ${color}; padding: 15px 20px; margin: 20px 0; border-radius: 4px; }
            .footer { background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { color: #6b7280; margin: 0; font-size: 14px; }
            .button { display: inline-block; background-color: ${color}; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">${icon}</div>
              <h1>${title}</h1>
            </div>

            <div class="content">
              <div class="highlight">
                <div class="message">${message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
              </div>

              <p class="message">
                You received this notification because you have email updates enabled in your account settings.
                You can change your notification preferences at any time.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings" class="button">
                  Manage Preferences
                </a>
              </div>
            </div>

            <div class="footer">
              <p>This is an automated notification from Attendance App.</p>
              <p>You can update your notification preferences in your account settings.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send notification email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending notification email:", error);
    return { success: false, error: "Failed to send email" };
  }
}