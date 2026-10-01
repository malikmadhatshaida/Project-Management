import nodemailer from "nodemailer";

/**
 * Creates and caches the Brevo SMTP nodemailer transporter
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp-relay.brevo.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass || user.includes("your-brevo-login")) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    auth: {
      user,
      pass,
    },
  });
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Generic email dispatcher using Brevo SMTP
 */
export async function sendEmail({ to, subject, html, text, from }: SendEmailOptions) {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(
      "⚠️ [Email Service] Brevo SMTP credentials are not configured in .env. Email dispatch skipped:",
      { to, subject }
    );
    return {
      success: false,
      error: "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD in .env.",
    };
  }

  const sender = from || process.env.SMTP_FROM || `"Project Management" <${process.env.SMTP_USER}>`;

  try {
    const info = await transporter.sendMail({
      from: sender,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ""),
    });

    console.log(`✉️ Email successfully sent via Brevo SMTP to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ Failed to send email via Brevo SMTP:", error);
    return { success: false, error: error.message || "Failed to send email" };
  }
}

/**
 * Sends a password reset email
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string, name?: string) {
  const subject = "Password Reset Request";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #1e293b; margin-bottom: 16px;">Password Reset Request</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        Hello ${name ? name : ""},
      </p>
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        We received a request to reset your password for your Project Management account. Click the button below to proceed:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
        If you didn't request a password reset, you can safely ignore this email. The link will expire shortly.
      </p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center;">
        Sent via Brevo SMTP &bull; Project Management Platform
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Sends an invitation email to a new team member
 */
export async function sendInvitationEmail({
  to,
  inviterName,
  companyName,
  inviteUrl,
  roleName,
}: {
  to: string;
  inviterName: string;
  companyName: string;
  inviteUrl: string;
  roleName?: string;
}) {
  const subject = `You've been invited to join ${companyName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #1e293b; margin-bottom: 16px;">Team Invitation</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong>${roleName ? ` as a <strong>${roleName}</strong>` : ""}.
      </p>
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        Collaborate on projects, track tasks, manage sprints, and communicate with your team in one unified workspace.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
          Accept Invitation & Join
        </a>
      </div>
      <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
        Or copy and paste this link in your browser: <br />
        <a href="${inviteUrl}" style="color: #4f46e5; word-break: break-all;">${inviteUrl}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center;">
        Sent via Brevo SMTP &bull; Project Management Platform
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}
