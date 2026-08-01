import 'dotenv/config';
import express from 'express';
import Groq from 'groq-sdk';

const app = express();
const port = Number(process.env.PORT || 3000);
const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const requestsByIp = new Map();
const assistantInstructions = 'You are Shifra, a concise, warm everyday assistant. Reply in the user’s language; support English, Hindi, and Hinglish. Use plain text only: no Markdown, headings, bullets, bold text, backticks, tables, or code blocks. Keep everyday answers to three short sentences unless the user explicitly asks for a detailed explanation or code. Never invent real-time facts, current weather, live prices, current news, or information you are not confident about. For any answer you cannot provide reliably, reply with exactly UNAVAILABLE as the first word, then a short plain-text reason. Do not claim to perform actions you cannot perform. For high-stakes medical, legal, or financial questions, recommend consulting a qualified professional.';

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
  if (!process.env.GROQ_API_KEY) return response.status(503).json({ error: 'AI service is not configured yet.' });
  const message = typeof request.body?.message === 'string' ? request.body.message.trim().slice(0, 2_000) : '';
  if (!message) return response.status(400).json({ error: 'Please enter a message.' });
  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'developer', content: assistantInstructions },
        ...normalizeHistory(request.body?.history),
        { role: 'user', content: message }
      ],
      temperature: 0.4,
      max_completion_tokens: 220
    });
    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) throw new Error('Empty model response');
    response.json({ reply });
  } catch (error) {
    console.error('Groq request failed:', error?.status || error?.name || 'unknown error');
    response.status(502).json({ error: 'I could not reach the AI service. Please try again.' });
  }
});

app.use('/node_modules', (_, response) => response.sendStatus(404));
app.use(['/server.mjs', '/package.json', '/package-lock.json'], (_, response) => response.sendStatus(404));
app.use(express.static('.', { dotfiles: 'deny', extensions: ['html'] }));
app.listen(port, () => console.log(`Shifra is running at http://localhost:${port}`));
