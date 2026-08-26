// lib/email/account-link-confirmation.ts
import { transporter } from "@/lib/nodemailer" // ajuste o path conforme onde o transporter vive no seu projeto

export async function sendAccountLinkConfirmationEmail(opts: {
  to: string
  confirmToken: string
  requestingAppName: string
  scopes: string[]
}) {
  const confirmUrl = `${process.env.APP_URL}/account-link/confirm?token=${opts.confirmToken}`
  const declineUrl = `${process.env.APP_URL}/account-link/decline?token=${opts.confirmToken}`

  await transporter.sendMail({
    from: process.env.NODEMAILER_EMAIL!,
    to: opts.to,
    subject: `${opts.requestingAppName} quer se conectar à sua conta Budget Tracker`,
    html: `
      <p>O aplicativo <strong>${opts.requestingAppName}</strong> pediu para se conectar
      a esta conta do Budget Tracker, usando o mesmo e-mail cadastrado aqui.</p>
      <p>Permissões solicitadas: ${opts.scopes.join(", ")}</p>
      <p>Se foi você quem iniciou essa conexão:</p>
      <p><a href="${confirmUrl}">Confirmar vínculo</a></p>
      <p>Se você não reconhece essa solicitação:</p>
      <p><a href="${declineUrl}">Recusar</a></p>
      <p>Este link expira em 24 horas e só pode ser usado uma vez.</p>
    `,
  })
}