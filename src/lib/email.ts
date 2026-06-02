import nodemailer from 'nodemailer'

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    secure: process.env.EMAIL_SERVER_PORT === '465',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })
}

const FROM = process.env.EMAIL_FROM ?? 'Trade Nest <noreply@tradenest.com>'

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const transporter = createTransport()
    await transporter.sendMail({ from: FROM, to, subject, html })
  } catch (err) {
    // Never let a failed email crash the caller — log silently
    console.error('[email] Failed to send email to', to, err)
  }
}

export async function sendOtpEmail(email: string, otp: string) {
  const from = process.env.EMAIL_FROM ?? 'Trade Nest <noreply@tradenest.com>'
  const transporter = createTransport()

  await transporter.sendMail({
    from,
    to: email,
    subject: `${otp} — Your Trade Nest verification code`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#fcf9f8;font-family:Inter,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fcf9f8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #cec3d3;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:#4b0082;padding:32px;text-align:center;">
              <img src="${process.env.APP_URL ?? 'http://localhost:3000'}/assets/logo.svg" alt="Trade Nest" style="height:40px;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 8px;font-family:Manrope,sans-serif;font-size:22px;font-weight:700;color:#1c1b1b;letter-spacing:-0.01em;">Verify your email</h2>
              <p style="margin:0 0 32px;font-size:14px;color:#4c4451;line-height:1.6;">
                Use the code below to complete your Trade Nest registration. It expires in <strong>15 minutes</strong>.
              </p>
              <!-- OTP Box -->
              <div style="background:#f6f3f2;border-radius:12px;padding:32px;text-align:center;margin-bottom:32px;border:1px solid #e5e2e1;">
                <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7d7483;font-family:Inter,sans-serif;">VERIFICATION CODE</p>
                <p style="margin:0;font-family:Manrope,sans-serif;font-size:48px;font-weight:800;letter-spacing:0.15em;color:#4b0082;">${otp}</p>
              </div>
              <p style="margin:0;font-size:13px;color:#7d7483;line-height:1.6;">
                If you didn't request this code, you can safely ignore this email. Never share this code with anyone.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #f0edec;text-align:center;">
              <p style="margin:0;font-size:11px;color:#7d7483;font-family:Inter,sans-serif;">
                © 2024 Trade Nest Global Inc. · Secure Gift Card Exchange
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `Your Trade Nest verification code is: ${otp}\n\nThis code expires in 15 minutes. Do not share it with anyone.`,
  })
}
