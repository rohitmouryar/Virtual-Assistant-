const $ = (selector) => document.querySelector(selector);
const messages = $('#messages');
const input = $('#userInput');
const form = $('#chatForm');
const micBtn = $('#micBtn');
const themeBtn = $('#themeBtn');
const soundBtn = $('#soundBtn');
const STORAGE_KEY = 'shifra-conversation-v2';
let soundEnabled = localStorage.getItem('shifra-sound') !== 'off';

function escapeText(value) {
  const node = document.createElement('div');
  node.textContent = value;
  return node.innerHTML;
}

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function saveConversation() {
  const history = [...messages.querySelectorAll('.message')].map((item) => ({
    role: item.classList.contains('user') ? 'user' : 'assistant',
    text: item.querySelector('.bubble-text')?.textContent || ''
  })).filter((item) => item.text);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-40)));
}

function addMessage(text, role = 'assistant', shouldSave = true) {
  const article = document.createElement('article');
  article.className = `message ${role}`;
  article.innerHTML = `<div class="message-avatar">${role === 'user' ? 'YOU' : 'S'}</div><div class="bubble"><div class="bubble-text">${escapeText(text)}</div><div class="meta">${timeNow()}</div>${role === 'assistant' ? '<button class="copy-btn" type="button">Copy answer</button>' : ''}</div>`;
  const copy = article.querySelector('.copy-btn');
  copy?.addEventListener('click', async () => {
    await navigator.clipboard?.writeText(text);
    copy.textContent = 'Copied';
    setTimeout(() => copy.textContent = 'Copy answer', 1200);
  });
  messages.append(article);
  messages.scrollTop = messages.scrollHeight;
  if (shouldSave) saveConversation();
}

function speak(text) {
  if (!soundEnabled || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = /[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-IN';
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
}

function calculate(message) {
  const normalized = message.replace(/calculate|what is|solve/gi, '').replace(/[×x]/g, '*').replace(/÷/g, '/').trim();
  if (!/^[\d\s+\-*/().%]+$/.test(normalized)) return null;
  try {
    const tokens = normalized.match(/\d+(?:\.\d+)?|[()+\-*/%]/g);
    if (!tokens || tokens.join('') !== normalized.replace(/\s/g, '')) return null;
    let position = 0;
    const parsePrimary = () => {
      if (tokens[position] === '(') {
        position++;
        const value = parseExpression();
        if (tokens[position++] !== ')') throw new Error('Missing bracket');
        return value;
      }
      const value = Number(tokens[position++]);
      if (!Number.isFinite(value)) throw new Error('Invalid number');
      return value;
    };
    const parseUnary = () => tokens[position] === '-' ? (position++, -parseUnary()) : parsePrimary();
    const parseTerm = () => {
      let value = parseUnary();
      while (['*', '/', '%'].includes(tokens[position])) {
        const operator = tokens[position++];
        const right = parseUnary();
        value = operator === '*' ? value * right : operator === '/' ? value / right : value % right;
      }
      return value;
    };
    const parseExpression = () => {
      let value = parseTerm();
      while (['+', '-'].includes(tokens[position])) {
        const operator = tokens[position++];
        const right = parseTerm();
        value = operator === '+' ? value + right : value - right;
      }
      return value;
    };
    const result = parseExpression();
    if (position !== tokens.length) return null;
    return Number.isFinite(result) ? `${normalized} = ${result}` : null;
  } catch { return null; }
}

function getReply(raw) {
  const message = raw.toLowerCase().trim();
  const math = calculate(message);
  if (math) return math;
  if (/^(hi|hello|hey|namaste)|\bhello\b/.test(message)) return 'Hello! I’m Shifra. How can I help you today?';
  if (message.includes('how are you')) return 'I’m working perfectly and ready to help. How are you doing?';
  if (message.includes('who are you') || message.includes('your name')) return 'I’m Shifra, your browser-based virtual assistant. I can answer common questions, calculate, tell the date and time, and open useful websites.';
  if (message.includes('what can you do') || message === 'help') return 'Try asking for the date or time, a calculation like “45 * 12”, or say “open YouTube”. For topics outside my built-in knowledge, I can open a Google search.';
  if (message.includes('time')) return `The current time is ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`;
  if (message.includes('date') || message.includes('day')) return `Today is ${new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`;
  const sites = { youtube: 'https://www.youtube.com', google: 'https://www.google.com', facebook: 'https://www.facebook.com', instagram: 'https://www.instagram.com', chatgpt: 'https://chatgpt.com' };
  const site = Object.keys(sites).find((name) => message.includes(`open ${name}`));
  if (site) { window.open(sites[site], '_blank', 'noopener'); return `Opening ${site[0].toUpperCase() + site.slice(1)} for you.`; }
  if (message.includes('thank')) return 'You’re welcome! I’m here whenever you need me.';
  const query = encodeURIComponent(raw);
  setTimeout(() => window.open(`https://www.google.com/search?q=${query}`, '_blank', 'noopener'), 700);
  return `I don’t have a reliable built-in answer for that yet, so I’m opening a Google search for “${raw}”.`;
}

function showTyping() {
  const node = document.createElement('article');
  node.className = 'message typing-message';
  node.innerHTML = '<div class="message-avatar">S</div><div class="bubble typing"><span></span><span></span><span></span></div>';
  messages.append(node); messages.scrollTop = messages.scrollHeight;
  return node;
}

function sendMessage(text) {
  const clean = text.trim();
  if (!clean) return;
  addMessage(clean, 'user'); input.value = ''; input.focus();
  const typing = showTyping();
  setTimeout(() => { typing.remove(); const reply = getReply(clean); addMessage(reply); speak(reply); }, 550);
}

form.addEventListener('submit', (event) => { event.preventDefault(); sendMessage(input.value); });
$('#suggestions').addEventListener('click', (event) => { if (event.target.matches('button')) sendMessage(event.target.textContent); });
$('#clearBtn').addEventListener('click', () => { localStorage.removeItem(STORAGE_KEY); messages.innerHTML = ''; addMessage('Conversation cleared. What would you like to explore next?'); });

const preferredTheme = localStorage.getItem('shifra-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.dataset.theme = preferredTheme;
themeBtn.textContent = preferredTheme === 'dark' ? '☀' : '☾';
themeBtn.addEventListener('click', () => { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; themeBtn.textContent = next === 'dark' ? '☀' : '☾'; localStorage.setItem('shifra-theme', next); });
function updateSound() { soundBtn.textContent = soundEnabled ? '🔊' : '🔇'; soundBtn.setAttribute('aria-label', soundEnabled ? 'Turn spoken replies off' : 'Turn spoken replies on'); }
soundBtn.addEventListener('click', () => { soundEnabled = !soundEnabled; localStorage.setItem('shifra-sound', soundEnabled ? 'on' : 'off'); if (!soundEnabled) speechSynthesis?.cancel(); updateSound(); }); updateSound();

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Recognition) {
  const recognition = new Recognition(); recognition.lang = 'en-IN'; recognition.interimResults = false;
  micBtn.addEventListener('click', () => { try { recognition.start(); micBtn.classList.add('listening'); } catch {} });
  recognition.onresult = (event) => sendMessage(event.results[0][0].transcript);
  recognition.onend = () => micBtn.classList.remove('listening');
  recognition.onerror = () => { micBtn.classList.remove('listening'); $('#supportNote').textContent = 'Voice input was unavailable. Please type your message.'; };
} else { micBtn.disabled = true; micBtn.title = 'Voice input is not supported in this browser'; }

try {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (history.length) history.forEach((item) => addMessage(item.text, item.role, false));
  else addMessage('Hi! I’m Shifra, your virtual assistant. Ask me a question or choose a suggestion below.');
} catch { addMessage('Hi! I’m Shifra. How can I help you today?'); }
