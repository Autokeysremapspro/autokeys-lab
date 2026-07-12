import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM || 'AK Cloud <notificaciones@autokeysremapspro.com>'

function getClient() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function wrapTemplate(title: string, bodyHtml: string, ctaHref?: string, ctaLabel?: string) {
  return `
  <div style="background:#050505;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#0b0d10;border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#d90429,#ff2448);padding:20px 28px;">
        <span style="color:#fff;font-weight:800;font-size:15px;letter-spacing:.04em;text-transform:uppercase;">AK Cloud · Autokeys</span>
      </div>
      <div style="padding:28px;color:#e5e5e5;">
        <h1 style="font-size:20px;margin:0 0 14px;color:#fff;">${title}</h1>
        <div style="font-size:14px;line-height:1.6;color:#b5b5b5;">${bodyHtml}</div>
        ${
          ctaHref
            ? `<a href="${ctaHref}" style="display:inline-block;margin-top:22px;background:linear-gradient(135deg,#d90429,#ff2448);color:#fff;text-decoration:none;font-weight:700;font-size:13px;text-transform:uppercase;padding:12px 22px;border-radius:10px;">${ctaLabel || 'Ver en el portal'}</a>`
            : ''
        }
      </div>
      <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,.06);color:#555;font-size:11px;">
        Autokeys Remaps Pro · AK Cloud
      </div>
    </div>
  </div>`
}

/**
 * Envía un email de notificación. Si no hay RESEND_API_KEY configurada,
 * no lanza error — simplemente no envía (el resto del flujo sigue
 * funcionando igual que antes, solo sin email). Así este helper es
 * seguro de usar aunque todavía no hayas dado de alta la cuenta de Resend.
 */
export async function sendNotificationEmail(params: {
  to: string | null | undefined
  subject: string
  title: string
  bodyHtml: string
  ctaHref?: string
  ctaLabel?: string
}) {
  const { to, subject, title, bodyHtml, ctaHref, ctaLabel } = params
  if (!to) return { sent: false, reason: 'sin destinatario' }

  const client = getClient()
  if (!client) return { sent: false, reason: 'RESEND_API_KEY no configurada' }

  try {
    await client.emails.send({
      from: FROM,
      to,
      subject,
      html: wrapTemplate(title, bodyHtml, ctaHref, ctaLabel),
    })
    return { sent: true }
  } catch (error: any) {
    // Un fallo de email nunca debe romper la acción principal (aprobar
    // pedido, recarga, etc.) — se registra pero no se relanza.
    console.error('Error enviando email:', error?.message || error)
    return { sent: false, reason: error?.message || 'error desconocido' }
  }
}
