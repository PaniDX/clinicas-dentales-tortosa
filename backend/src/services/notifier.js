import twilio from 'twilio';

export function createNotifier() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !from) {
    console.warn('Twilio no configurado — los mensajes se simularán');
    return {
      async sendConfirmation(/* { nombre, telefono, fecha, hora, tratamiento } */) {
        console.log('[SIMULADO] Mensaje de confirmación enviado');
        return { simulated: true };
      },
    };
  }

  const client = twilio(accountSid, authToken);

  return {
    async sendConfirmation({ nombre, telefono, fecha, hora, tratamiento }) {
      const to = `whatsapp:${telefono.replace(/[^0-9]/g, '')}`;
      const body = `Hola ${nombre}, tu cita en la clínica dental ha sido confirmada:\n\n📅 Fecha: ${fecha}\n⏰ Hora: ${hora}\n🦷 Tratamiento: ${tratamiento}\n\nTe esperamos.`;

      const message = await client.messages.create({
        from: `whatsapp:${from}`,
        to,
        body,
      });

      return { sid: message.sid };
    },
  };
}
