import { BrevoClient } from '@getbrevo/brevo'
import { config } from '../config/index.js'

let brevo

function getBrevo() {
  if (!brevo) {
    brevo = new BrevoClient({ apiKey: config.brevoApiKey })
  }
  return brevo
}

const EMAIL_TEMPLATES = {
  delete_account: {
    subject: 'Delete Account OTP',
    title: 'Delete Account OTP',
    message: 'use the code below to delete your account.',
    otpColor: '#ef4444',
  },
  password_reset: {
    subject: 'Set Password OTP',
    title: 'Set Your Password',
    message: 'use the code below to set a new password for your account.',
    otpColor: '#7c3aed',
  },
}

export async function sendOTPEmail({ email, name, otp, purpose = 'delete_account' }) {
  const t = EMAIL_TEMPLATES[purpose] || EMAIL_TEMPLATES.delete_account
  const safeName = escapeHtml(name || 'there')
  const result = await getBrevo().transactionalEmails.sendTransacEmail({
    subject: t.subject,
    htmlContent: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #0f0f0f;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #0f0f0f; padding: 40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a4a;">
        <tr><td style="padding: 40px 32px 32px; text-align: center;">
          <h1 style="margin: 0 0 8px; font-size: 24px; color: #f0f0f0;">${t.title}</h1>
          <p style="margin: 0 0 24px; font-size: 14px; color: #a0a0b0;">Hi ${safeName}, ${t.message}</p>
          <div style="background: #0f0f1f; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #2a2a4a;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: ${t.otpColor}; font-family: 'Courier New', monospace;">${otp}</span>
          </div>
          <p style="margin: 0 0 8px; font-size: 12px; color: #606070;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    sender: { name: 'AssessAI', email: config.fromEmail },
    to: [{ email }],
  })

  return result
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendPasswordResetEmail({ email, name, resetUrl }) {
  const safeName = escapeHtml(name || 'there')
  const safeUrl = escapeHtml(resetUrl)
  const result = await getBrevo().transactionalEmails.sendTransacEmail({
    subject: 'Reset your AssessAI password',
    htmlContent: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #0f0f0f;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #0f0f0f; padding: 40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a4a;">
        <tr><td style="padding: 40px 32px 32px; text-align: center;">
          <h1 style="margin: 0 0 8px; font-size: 24px; color: #f0f0f0;">Reset your password</h1>
          <p style="margin: 0 0 24px; font-size: 14px; color: #a0a0b0;">Hi ${safeName}, click the button below to choose a new password. Link expires in 1 hour.</p>
          <a href="${safeUrl}" style="display: inline-block; background: #f97316; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 10px;">Reset password</a>
          <p style="margin: 24px 0 0; font-size: 12px; color: #606070;">If you didn't request this, ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    sender: { name: 'AssessAI', email: config.fromEmail },
    to: [{ email }],
  })
  return result
}
