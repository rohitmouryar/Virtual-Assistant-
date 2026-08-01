# Shifra Virtual Assistant

A lightweight, privacy-friendly browser assistant built with HTML, CSS, and vanilla JavaScript. Shifra handles everyday commands through text or voice without an account; optional AI chat uses Groq's free API tier.

> Shifra is currently rule-based, not a generative-AI chatbot. It gives instant answers for supported tasks and offers an optional Google search for other queries.

## Highlights

- Text input, English/Hindi/Hinglish voice input, and spoken replies
- Safe basic calculations, date, time, and useful website shortcuts
- Optional Google search button for unsupported questions
- Conversation history stored only in the browser
- Light and dark themes, responsive layout, and keyboard-friendly controls
- Installable as a Progressive Web App (PWA) on supported browsers

## Run locally

Clone the project, install the server dependencies, and configure your API key:

```bash
git clone https://github.com/rohitmouryar/Virtual-Assistant-.git
cd Virtual-Assistant-
npm install
copy .env.example .env
```

Create a free Groq API key at [console.groq.com](https://console.groq.com/keys), put it in `.env` as `GROQ_API_KEY`, then run `npm start` and open `http://localhost:3000`. Chrome or Edge offers the most reliable speech-recognition support. The assistant still works without an API key for its built-in commands; other questions show an optional Google search fallback.

## Try these commands

- `What time is it?`
- `Calculate 24 × 18`
- `Open YouTube`
- `Who are you?`
- `Samay kya hua hai?`

## Privacy

Conversation history, theme, and sound settings are saved in your browser's local storage. Voice recognition is provided by the browser. The Groq key is kept only in the server-side `.env` file and must never be added to the frontend or committed to GitHub. When Shifra cannot answer a question and the AI service is unavailable, it asks before opening a Google search.

## Deploy on Vercel

This project includes a Vercel Serverless Function at `api/chat.js`. Vercel hosts the website and this secure API route together; do not add a key to any frontend file.

1. Push this project to GitHub and import the repository into Vercel.
2. In Vercel, open **Project → Settings → Environment Variables**.
3. Add `GROQ_API_KEY` with your Groq key. Select **Production**, **Preview**, and **Development**.
4. Optionally add `GROQ_MODEL` with `openai/gpt-oss-20b`.
5. Redeploy the project after saving the variables.

The variable is read only by the serverless function and is not exposed to browser visitors.

## Roadmap

- [x] Responsive assistant interface and browser-based voice controls
- [x] Installable PWA foundation
- [x] Hindi/Hinglish voice input and language selection
- [ ] Reminders and useful daily productivity commands
- [x] Optional AI-powered responses through a secure backend
- [x] Automated validation and contribution guidelines
- [ ] Public live demo

## Contributing

Ideas, bug reports, and pull requests are welcome. Please open an issue describing the improvement before building a large feature.
