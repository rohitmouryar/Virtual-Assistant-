import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';

const app = express();
const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || 'gpt-5.6-sol';
const requestsByIp = new Map();

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use((_, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
  next();
});

function rateLimit(request, response, next) {
  const now = Date.now();
  const key = request.ip || 'unknown';
  const recent = (requestsByIp.get(key) || []).filter((timestamp) => now - timestamp < 60_000);
  if (recent.length >= 20) return response.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
  recent.push(now);
  requestsByIp.set(key, recent);
  next();
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-10).flatMap((item) => {
    if (!item || !['user', 'assistant'].includes(item.role) || typeof item.text !== 'string') return [];
    const text = item.text.trim().slice(0, 1_000);
    return text ? [{ role: item.role, content: text }] : [];
  });
}

app.post('/api/chat', rateLimit, async (request, response) => {
  if (!process.env.OPENAI_API_KEY) return response.status(503).json({ error: 'AI service is not configured yet.' });
  const message = typeof request.body?.message === 'string' ? request.body.message.trim().slice(0, 2_000) : '';
  if (!message) return response.status(400).json({ error: 'Please enter a message.' });
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.responses.create({
      model,
      input: [
        { role: 'developer', content: 'You are Shifra, a concise, warm everyday assistant. Reply in the user’s language; support English, Hindi, and Hinglish. Do not claim to perform actions you cannot perform. For high-stakes medical, legal, or financial questions, recommend consulting a qualified professional.' },
        ...normalizeHistory(request.body?.history),
        { role: 'user', content: message }
      ]
    });
    const reply = completion.output_text?.trim();
    if (!reply) throw new Error('Empty model response');
    response.json({ reply });
  } catch (error) {
    console.error('OpenAI request failed:', error?.status || error?.name || 'unknown error');
    response.status(502).json({ error: 'I could not reach the AI service. Please try again.' });
  }
});

app.use('/node_modules', (_, response) => response.sendStatus(404));
app.use(['/server.mjs', '/package.json', '/package-lock.json'], (_, response) => response.sendStatus(404));
app.use(express.static('.', { dotfiles: 'deny', extensions: ['html'] }));
app.listen(port, () => console.log(`Shifra is running at http://localhost:${port}`));
