const $ = (selector) => document.querySelector(selector);
const messages = $('#messages');
const input = $('#userInput');
const form = $('#chatForm');
const micBtn = $('#micBtn');
const themeBtn = $('#themeBtn');
const soundBtn = $('#soundBtn');
const languageBtn = $('#languageBtn');
const STORAGE_KEY = 'shifra-conversation-v2';
const MAX_SAVED_MESSAGES = 40;
let soundEnabled = localStorage.getItem('shifra-sound') !== 'off';
const voiceLanguages = [
  { code: 'en-IN', label: 'EN', name: 'English (India)' },
  { code: 'hi-IN', label: 'हिं', name: 'Hindi' },
  { code: 'en-IN', label: 'MIX', name: 'Hinglish' }
];
let voiceLanguageIndex = Number(localStorage.getItem('shifra-voice-language') || 0);
if (!voiceLanguages[voiceLanguageIndex]) voiceLanguageIndex = 0;

function escapeText(value) {
  const node = document.createElement('div');
  node.textContent = value;
  return node.innerHTML;
}

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function saveConversation() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversationHistory(MAX_SAVED_MESSAGES)));
  } catch {
    $('#supportNote').textContent = 'Chat history could not be saved in this browser.';
  }
}

function conversationHistory(limit = 10) {
  return [...messages.querySelectorAll('.message')].map((item) => ({
    role: item.classList.contains('user') ? 'user' : 'assistant',
    text: item.querySelector('.bubble-text')?.textContent || ''
  })).filter((item) => item.text).slice(-limit);
}

function addMessage(text, role = 'assistant', shouldSave = true, action = null) {
  const article = document.createElement('article');
  article.className = `message ${role}`;
  const actionButton = action ? `<button class="search-btn" type="button">${escapeText(action.label)}</button>` : '';
  article.innerHTML = `<div class="message-avatar">${role === 'user' ? 'YOU' : 'S'}</div><div class="bubble"><div class="bubble-text">${escapeText(text)}</div><div class="meta">${timeNow()}</div>${role === 'assistant' ? '<button class="copy-btn" type="button">Copy answer</button>' : ''}${actionButton}</div>`;
  const copy = article.querySelector('.copy-btn');
  copy?.addEventListener('click', async () => {
    await navigator.clipboard?.writeText(text);
    copy.textContent = 'Copied';
    setTimeout(() => copy.textContent = 'Copy answer', 1200);
  });
  article.querySelector('.search-btn')?.addEventListener('click', () => window.open(action.url, '_blank', 'noopener'));
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
  if (/^(hi|hello|hey|namaste|namaskar|नमस्ते)|\bhello\b/.test(message)) return 'Hello! I’m Shifra. How can I help you today?';
  if (message.includes('how are you') || message.includes('kaise ho') || message.includes('कैसे हो')) return 'I’m working perfectly and ready to help. How are you doing?';
  if (message.includes('who are you') || message.includes('your name') || message.includes('kaun ho') || message.includes('कौन हो')) return 'I’m Shifra, your browser-based virtual assistant. I can answer common questions, calculate, tell the date and time, and open useful websites.';
  if (message.includes('what can you do') || message === 'help' || message.includes('madad') || message.includes('मदद')) return 'Try asking for the date or time, a calculation like “45 * 12”, or say “open YouTube”. For topics outside my built-in knowledge, I can open a Google search.';
  if (/(time|samay|kitne baje|baj rahe|समय|कितने बजे)/.test(message)) return `The current time is ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`;
  if (/(date|day|tarikh|aaj ka din|तारीख|दिन)/.test(message)) return `Today is ${new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`;
  const sites = { youtube: 'https://www.youtube.com', google: 'https://www.google.com', facebook: 'https://www.facebook.com', instagram: 'https://www.instagram.com', chatgpt: 'https://chatgpt.com' };
  const site = Object.keys(sites).find((name) => message.includes(`open ${name}`));
  if (site) { window.open(sites[site], '_blank', 'noopener'); return `Opening ${site[0].toUpperCase() + site.slice(1)} for you.`; }
  if (message.includes('thank')) return 'You’re welcome! I’m here whenever you need me.';
  return {
    text: `I don’t have a reliable built-in answer for that yet. You can search Google for “${raw}”.`,
    action: { label: 'Search Google', url: `https://www.google.com/search?q=${encodeURIComponent(raw)}` }
  };
}

async function getAssistantReply(raw) {
  const localReply = getReply(raw);
  if (typeof localReply === 'string') return localReply;
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: raw, history: conversationHistory().slice(0, -1) })
    });
    const data = await response.json();
    if (!response.ok || typeof data.reply !== 'string') throw new Error(data.error || 'AI request failed');
    return data.reply;
  } catch {
    return localReply;
  }
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
  setTimeout(async () => {
    typing.remove();
    const result = await getAssistantReply(clean);
    const reply = typeof result === 'string' ? result : result.text;
    addMessage(reply, 'assistant', true, typeof result === 'string' ? null : result.action);
    speak(reply);
  }, 550);
}

form.addEventListener('submit', (event) => { event.preventDefault(); sendMessage(input.value); });
$('#suggestions').addEventListener('click', (event) => { if (event.target.matches('button')) sendMessage(event.target.textContent); });
function clearConversation() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  messages.innerHTML = '';
  addMessage('Conversation cleared. What would you like to explore next?', 'assistant', false);
  $('#supportNote').textContent = 'Conversation cleared from this device.';
}

$('#clearBtn').addEventListener('click', clearConversation);
$('#headerClearBtn').addEventListener('click', clearConversation);

const preferredTheme = localStorage.getItem('shifra-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.dataset.theme = preferredTheme;
themeBtn.textContent = preferredTheme === 'dark' ? '☀' : '☾';
themeBtn.addEventListener('click', () => { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; themeBtn.textContent = next === 'dark' ? '☀' : '☾'; localStorage.setItem('shifra-theme', next); });
function updateSound() { soundBtn.textContent = soundEnabled ? '🔊' : '🔇'; soundBtn.setAttribute('aria-label', soundEnabled ? 'Turn spoken replies off' : 'Turn spoken replies on'); }
soundBtn.addEventListener('click', () => { soundEnabled = !soundEnabled; localStorage.setItem('shifra-sound', soundEnabled ? 'on' : 'off'); if (!soundEnabled) speechSynthesis?.cancel(); updateSound(); }); updateSound();

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Recognition) {
  const recognition = new Recognition(); recognition.interimResults = false;
  function updateVoiceLanguage() {
    const language = voiceLanguages[voiceLanguageIndex];
    recognition.lang = language.code;
    languageBtn.textContent = language.label;
    languageBtn.title = `Voice input: ${language.name}`;
    languageBtn.setAttribute('aria-label', `Voice input language: ${language.name}. Switch language`);
  }
  languageBtn.addEventListener('click', () => {
    voiceLanguageIndex = (voiceLanguageIndex + 1) % voiceLanguages.length;
    localStorage.setItem('shifra-voice-language', String(voiceLanguageIndex));
    updateVoiceLanguage();
    $('#supportNote').textContent = `Voice input set to ${voiceLanguages[voiceLanguageIndex].name}.`;
  });
  updateVoiceLanguage();
  micBtn.addEventListener('click', () => { try { recognition.start(); micBtn.classList.add('listening'); } catch {} });
  recognition.onresult = (event) => sendMessage(event.results[0][0].transcript);
  recognition.onend = () => micBtn.classList.remove('listening');
  recognition.onerror = () => { micBtn.classList.remove('listening'); $('#supportNote').textContent = 'Voice input was unavailable. Please type your message.'; };
} else { micBtn.disabled = true; languageBtn.disabled = true; micBtn.title = 'Voice input is not supported in this browser'; languageBtn.title = 'Voice input is not supported in this browser'; }

try {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (history.length) history.forEach((item) => addMessage(item.text, item.role, false));
  else addMessage('Hi! I’m Shifra, your virtual assistant. Ask me a question or choose a suggestion below.');
} catch { addMessage('Hi! I’m Shifra. How can I help you today?'); }

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}
