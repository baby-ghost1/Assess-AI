import { Resend } from 'resend'
import { config } from '../config/index.js'

let resend

function getResend() {
  if (!resend) {
    resend = new Resend(config.resendApiKey)
  }
  return resend
}

export async function sendOTPEmail({ email, name, otp }) {
  const { data, error } = await getResend().emails.send({
    from: `AssessAI <${config.fromEmail}>`,
    to: email,
    subject: 'Delete Account OTP',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #0f0f0f;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #0f0f0f; padding: 40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a4a;">
        <tr><td style="padding: 40px 32px 32px; text-align: center;">
          <h1 style="margin: 0 0 8px; font-size: 24px; color: #f0f0f0;">Delete Account OTP</h1>
          <p style="margin: 0 0 24px; font-size: 14px; color: #a0a0b0;">Hi ${name}, use the code below to delete your account.</p>
          <div style="background: #0f0f1f; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #2a2a4a;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #7c3aed; font-family: 'Courier New', monospace;">${otp}</span>
          </div>
          <p style="margin: 0 0 8px; font-size: 12px; color: #606070;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })

  if (error) throw new Error(error.message)
  return data
}
