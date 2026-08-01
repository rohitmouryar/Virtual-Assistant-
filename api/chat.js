import Groq from 'groq-sdk';

const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const assistantInstructions = 'You are Shifra, a concise, warm everyday assistant. Reply in the user’s language; support English, Hindi, and Hinglish. Use plain text only: no Markdown, headings, bullets, bold text, backticks, tables, or code blocks. Keep everyday answers to three short sentences unless the user explicitly asks for a detailed explanation or code. Never invent real-time facts, current weather, live prices, current news, or information you are not confident about. For any answer you cannot provide reliably, reply with exactly UNAVAILABLE as the first word, then a short plain-text reason. Do not claim to perform actions you cannot perform. For high-stakes medical, legal, or financial questions, recommend consulting a qualified professional.';

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-10).flatMap((item) => {
    if (!item || !['user', 'assistant'].includes(item.role) || typeof item.text !== 'string') return [];
    const text = item.text.trim().slice(0, 1_000);
    return text ? [{ role: item.role, content: text }] : [];
  });
}

export default async function handler(request, response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.GROQ_API_KEY) return response.status(503).json({ error: 'AI service is not configured yet.' });

  const body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : (request.body || {});
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2_000) : '';
  if (!message) return response.status(400).json({ error: 'Please enter a message.' });

  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'developer', content: assistantInstructions },
        ...normalizeHistory(body.history),
        { role: 'user', content: message }
      ],
      temperature: 0.4,
      max_completion_tokens: 220
    });
    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) throw new Error('Empty model response');
    return response.status(200).json({ reply });
  } catch (error) {
    console.error('Groq request failed:', error?.status || error?.name || 'unknown error');
    return response.status(502).json({ error: 'I could not reach the AI service. Please try again.' });
  }
}
