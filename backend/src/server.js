import express from 'express';
import { createCorsMiddleware } from './middleware/cors.js';
import { createEvent } from './services/calendar.js';
import { createNotifier } from './services/notifier.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(createCorsMiddleware(process.env.ALLOWED_ORIGINS));

const notifier = createNotifier();

app.post('/api/appointments', async (req, res) => {
  try {
    const { nombre, telefono, tratamiento, fecha, hora } = req.body;

    // Validate required fields
    const missing = ['nombre', 'telefono', 'tratamiento', 'fecha', 'hora']
      .filter(k => !req.body[k] || (typeof req.body[k] === 'string' && !req.body[k].trim()));
    if (missing.length) {
      return res.status(400).json({ ok: false, error: `Faltan campos: ${missing.join(', ')}` });
    }

    // Validate phone format
    if (!/^[0-9\s\+]{9,15}$/.test(telefono)) {
      return res.status(400).json({ ok: false, error: 'Teléfono inválido' });
    }

    // Validate date/time
    const dateObj = new Date(`${fecha}T${hora}:00+02:00`);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ ok: false, error: 'Fecha u hora inválida' });
    }

    // Create Google Calendar event
    let calendarLink = null;
    try {
      calendarLink = await createEvent({ nombre, telefono, tratamiento, fecha, hora });
    } catch (err) {
      console.error('Calendar error:', err.message);
      // non-blocking — still send notification
    }

    // Send WhatsApp confirmation
    let notificationResult = null;
    try {
      notificationResult = await notifier.sendConfirmation({ nombre, telefono, tratamiento, fecha, hora });
    } catch (err) {
      console.error('Notifier error:', err.message);
    }

    res.json({
      ok: true,
      calendarLink,
      notificationSent: !!notificationResult,
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`API escuchando en puerto ${PORT}`);
});
