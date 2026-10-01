import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const recipient = body.to || auth.user.email;

    const result = await sendEmail({
      to: recipient,
      subject: "Brevo SMTP Test Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5;">Brevo SMTP Connected!</h2>
          <p style="color: #334155; font-size: 14px;">
            Your Brevo SMTP service is successfully configured and working in the Project Management system.
          </p>
          <p style="color: #64748b; font-size: 12px;">
            Sent to: ${recipient}<br />
            Timestamp: ${new Date().toISOString()}
          </p>
        </div>
      `,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${recipient}`,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error("Test email failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send test email" },
      { status: 500 }
    );
  }
}
