/**
 * Envío de WhatsApp vía Meta WhatsApp Cloud API (directa, sin Twilio).
 * Necesita 3 variables de entorno en Vercel:
 *   - WHATSAPP_ACCESS_TOKEN   (token de acceso de tu app en Meta for Developers)
 *   - WHATSAPP_PHONE_NUMBER_ID (ID del número de WhatsApp Business, no el número en sí)
 *   - STAFF_WHATSAPP_TO       (tu número, en formato internacional sin '+', ej. 34600111222)
 *
 * Si no están configuradas, no envía nada y no rompe nada — igual que
 * el helper de email.
 */
export async function sendWhatsAppNotification(mensaje: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const to = process.env.STAFF_WHATSAPP_TO

  if (!token || !phoneNumberId || !to) {
    return { sent: false, reason: 'WhatsApp no configurado (faltan variables de entorno)' }
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: mensaje.slice(0, 4000) },
      }),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Error enviando WhatsApp:', errorBody)
      return { sent: false, reason: errorBody }
    }

    return { sent: true }
  } catch (error: any) {
    console.error('Error enviando WhatsApp:', error?.message || error)
    return { sent: false, reason: error?.message || 'error desconocido' }
  }
}
