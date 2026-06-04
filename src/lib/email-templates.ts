const APP_URL = process.env.APP_URL ?? 'http://localhost:3000'

function baseLayout(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;">
          <!-- Brand header -->
          <tr>
            <td style="background:#4b0082;padding:28px 32px;border-radius:16px 16px 0 0;text-align:center;">
              <img src="${APP_URL}/assets/logo.svg" alt="Trade Nest" style="height:40px;display:inline-block;" />
            </td>
          </tr>
          <!-- Card body -->
          <tr>
            <td style="background:#ffffff;padding:40px 32px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#ffffff;padding:20px 32px 28px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7;border-radius:0 0 16px 16px;text-align:center;border-top:1px solid #f0edec;">
              <p style="margin:0;font-size:11px;color:#9ca3af;font-family:Inter,sans-serif;">
                © ${new Date().getFullYear()} Trade Nest · Secure Gift Card Exchange<br/>
                You're receiving this because you have an account on Trade Nest.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;padding:14px 28px;background:#4b0082;color:white;font-family:Manrope,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.01em;">${label}</a>`
}

function messageBox(content: string) {
  return `<div style="background:#f8f5ff;border-left:4px solid #7c3aed;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
    <p style="margin:0;font-size:14px;line-height:1.7;color:#1c1b1b;font-style:italic;">"${escapeHtml(content)}"</p>
  </div>`
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Template 1 — New message from seller → sent to admin
export function newMessageFromSellerHtml(sellerName: string, messageContent: string) {
  const link = `${APP_URL}/admin/messages`
  const body = `
    <h2 style="margin:0 0 8px;font-family:Manrope,sans-serif;font-size:22px;font-weight:700;color:#1c1b1b;letter-spacing:-0.01em;">New message from ${escapeHtml(sellerName)}</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Hi Admin, you have a new message waiting for your reply.</p>
    ${messageBox(messageContent)}
    <p style="margin:0 0 28px;font-size:14px;color:#6b7280;">Log in to view the full conversation and reply to ${escapeHtml(sellerName)}.</p>
    <div style="text-align:center;">${ctaButton(link, 'Open Admin Messages →')}</div>
    <p style="margin:28px 0 0;font-size:12px;color:#9ca3af;text-align:center;">Or copy this link: <a href="${link}" style="color:#7c3aed;">${link}</a></p>
  `
  return baseLayout(body)
}

export function newMessageFromSellerSubject(sellerName: string) {
  return `💬 New message from ${sellerName}`
}

// Template 2 — Admin replied → sent to seller
export function adminReplyHtml(sellerName: string, messageContent: string) {
  const link = `${APP_URL}/seller/messages`
  const body = `
    <h2 style="margin:0 0 8px;font-family:Manrope,sans-serif;font-size:22px;font-weight:700;color:#1c1b1b;letter-spacing:-0.01em;">The admin has replied</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${escapeHtml(sellerName)}, the Trade Nest team has sent you a reply.</p>
    ${messageBox(messageContent)}
    <p style="margin:0 0 28px;font-size:14px;color:#6b7280;">Log in to view the conversation and send your response.</p>
    <div style="text-align:center;">${ctaButton(link, 'View My Messages →')}</div>
    <p style="margin:28px 0 0;font-size:12px;color:#9ca3af;text-align:center;">Or copy this link: <a href="${link}" style="color:#7c3aed;">${link}</a></p>
  `
  return baseLayout(body)
}

export function adminReplySubject() {
  return `💬 The admin has replied to your message`
}

// Template 3 — Password Reset Email
export function passwordResetEmailHtml(userName: string, tempPassword: string, resetUrl: string) {
  const body = `
    <h2 style="margin:0 0 8px;font-family:Manrope,sans-serif;font-size:22px;font-weight:700;color:#1c1b1b;letter-spacing:-0.01em;">Password Reset Request</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${escapeHtml(userName)}, we received a request to reset your Trade Nest account password.</p>

    <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400e;">⚡ Temporary Password</p>
      <p style="margin:0;font-family:monospace;font-size:16px;font-weight:700;color:#1c1b1b;letter-spacing:0.05em;">${escapeHtml(tempPassword)}</p>
    </div>

    <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
      You can use this temporary password to log in immediately. For security, we recommend setting a new password of your choice.
    </p>

    <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
      <strong>Choose one option:</strong>
    </p>

    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:20px;margin-bottom:16px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#15803d;">Option 1: Use Temporary Password</p>
      <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
        Simply go to the login page and use your email with the temporary password shown above.
      </p>
    </div>

    <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:10px;padding:20px;margin-bottom:28px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1d4ed8;">Option 2: Set Custom Password</p>
      <p style="margin:0 0 16px;font-size:13px;color:#1e40af;line-height:1.6;">
        Click the button below to create your own secure password that you'll remember.
      </p>
      <div style="text-align:center;">${ctaButton(resetUrl, 'Set New Password →')}</div>
    </div>

    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
      This reset link expires in 1 hour. If you didn't request this, please ignore this email.<br/>
      <a href="${resetUrl}" style="color:#7c3aed;word-break:break-all;">${resetUrl}</a>
    </p>
  `
  return baseLayout(body)
}

export function passwordResetEmailSubject() {
  return `🔐 Password Reset - Trade Nest`
}

// Helper to send password reset email
export async function sendPasswordResetEmail(params: {
  to: string
  userName: string
  tempPassword: string
  resetUrl: string
}) {
  const { sendEmail } = await import('./email')

  await sendEmail({
    to: params.to,
    subject: passwordResetEmailSubject(),
    html: passwordResetEmailHtml(params.userName, params.tempPassword, params.resetUrl),
  })
}
