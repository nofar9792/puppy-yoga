import nodemailer from 'nodemailer'

interface BookingEmailOptions {
  to: string
  name: string
  classTitle: string
  classDate: string
  classTime: string
  price: number
}

function createTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST) return null
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? Number(SMTP_PORT) : 587,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  })
}

export async function sendBookingConfirmation(opts: BookingEmailOptions): Promise<void> {
  const transport = createTransport()
  if (!transport) return

  const formattedDate = new Date(opts.classDate).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@puppyyoga.com',
    to: opts.to,
    subject: `Booking Confirmed: ${opts.classTitle} 🐾`,
    html: `
      <h2>Your booking is confirmed! 🐾</h2>
      <p>Hi ${opts.name},</p>
      <p>You're all set for <strong>${opts.classTitle}</strong>.</p>
      <ul>
        <li><strong>Date:</strong> ${formattedDate} at ${opts.classTime}</li>
        <li><strong>Price:</strong> $${opts.price}</li>
      </ul>
      <p>See you on the mat! 🧘</p>
    `,
  })
}
