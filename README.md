# Shifra Virtual Assistant

A lightweight, privacy-friendly browser assistant built with HTML, CSS, and vanilla JavaScript. Shifra helps with everyday tasks through text or voice—without requiring an account or API key.

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

Put your OpenAI API key in `.env`, then run `npm start` and open `http://localhost:3000`. Chrome or Edge offers the most reliable speech-recognition support. The assistant still works without an API key for its built-in commands; other questions show an optional Google search fallback.

## Try these commands

- `What time is it?`
- `Calculate 24 × 18`
- `Open YouTube`
- `Who are you?`
- `Samay kya hua hai?`

## Privacy

Conversation history, theme, and sound settings are saved in your browser's local storage. Voice recognition is provided by the browser. The OpenAI key is kept only in the server-side `.env` file and must never be added to the frontend or committed to GitHub. When Shifra cannot answer a question and the AI service is unavailable, it asks before opening a Google search.

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
