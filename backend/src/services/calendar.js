import { google } from 'googleapis';

export function createCalendarClient() {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/calendar.events']
  );
  return google.calendar({ version: 'v3', auth });
}

export async function createEvent({ nombre, telefono, tratamiento, fecha, hora }) {
  const calendar = createCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error('GOOGLE_CALENDAR_ID no configurado');

  const start = new Date(`${fecha}T${hora}:00+02:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const event = {
    summary: `Cita: ${nombre} - ${tratamiento}`,
    description: `Paciente: ${nombre}\nTeléfono: ${telefono}\nTratamiento: ${tratamiento}`,
    start: { dateTime: start.toISOString(), timeZone: 'Europe/Madrid' },
    end: { dateTime: end.toISOString(), timeZone: 'Europe/Madrid' },
  };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return response.data.htmlLink;
}
