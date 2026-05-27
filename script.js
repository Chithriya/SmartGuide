// ===== AI CHATBOT FRONTEND SCRIPT =====

let isOpen = false;
let isLoading = false;

// Conversation history array — stores full chat for memory
let conversationHistory = [];

function toggleChat() {
  const chatbox = document.getElementById('chatbox');
  const iconChat = document.querySelector('.icon-chat');
  const iconClose = document.querySelector('.icon-close');

  isOpen = !isOpen;

  if (isOpen) {
    chatbox.style.display = 'flex';
    iconChat.style.display = 'none';
    iconClose.style.display = 'block';
    document.getElementById('userInput').focus();
    scrollToBottom();
  } else {
    chatbox.style.display = 'none';
    iconChat.style.display = 'block';
    iconClose.style.display = 'none';
  }
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function sendQuick(text) {
  document.getElementById('userInput').value = text;
  sendMessage();
}

function scrollToBottom() {
  const chatBody = document.getElementById('chatBody');
  if (chatBody) {
    setTimeout(() => {
      chatBody.scrollTop = chatBody.scrollHeight;
    }, 50);
  }
}

function getTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function appendUserMessage(text) {
  const chatBody = document.getElementById('chatBody');
  const wrapper = document.createElement('div');
  wrapper.className = 'message-wrapper user';
  wrapper.innerHTML = `
    <div class="user-message">${escapeHtml(text)}</div>
    <div class="msg-time">${getTime()}</div>
  `;
  chatBody.appendChild(wrapper);
  scrollToBottom();
}

function _renderBotMessage(text, isError = false) {
  const chatBody = document.getElementById('chatBody');
  const wrapper = document.createElement('div');
  wrapper.className = 'message-wrapper bot';
  const formatted = formatBotText(text);
  const btnId = 'speak-btn-' + Date.now();

  wrapper.innerHTML = `
    <div class="bot-message ${isError ? 'error-message' : ''}">
      ${formatted}
      <span class="source-tag">AI Assistant</span>
    </div>
    <div class="msg-meta">
      <div class="msg-time">${getTime()}</div>
      ${!isError ? `<button class="speak-btn" id="${btnId}" onclick="toggleSpeak(this)" title="Read aloud">
        <svg class="icon-speak" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
        <svg class="icon-stop" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:none;">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
      </button>` : ''}
    </div>
  `;

  if (!isError) {
    const btn = wrapper.querySelector('.speak-btn');
    if (btn) btn.dataset.text = plainText(text);
  }

  chatBody.appendChild(wrapper);
  scrollToBottom();
}

function formatBotText(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function showTyping() {
  const t = document.getElementById('typingIndicator');
  if (t) t.classList.remove('hidden');
  scrollToBottom();
}

function hideTyping() {
  const t = document.getElementById('typingIndicator');
  if (t) t.classList.add('hidden');
}

function setLoading(state) {
  isLoading = state;
  const btn = document.getElementById('sendBtn');
  const input = document.getElementById('userInput');
  if (btn) btn.disabled = state;
  if (input) input.disabled = state;
}

async function sendMessage() {
  if (isLoading) return;

  const input = document.getElementById('userInput');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';

  appendUserMessage(message);

  conversationHistory.push({
    role: 'user',
    content: message
  });

  showTyping();
  setLoading(true);

  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        history: conversationHistory.slice(0, -1)
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    hideTyping();

    const botReply = data.reply || 'Sorry, I could not process your request.';
    appendBotMessage(botReply);

    conversationHistory.push({
      role: 'assistant',
      content: botReply
    });

    if (conversationHistory.length > 40) {
      conversationHistory = conversationHistory.slice(-40);
    }

  } catch (err) {
    hideTyping();
    appendBotMessage(
      "Sorry, I'm having trouble connecting right now. Please try again in a moment, or try again in a moment.",
      true
    );
    console.error('Chat error:', err);
    conversationHistory.pop();
  } finally {
    setLoading(false);
    input.focus();
  }
}

function clearChat() {
  const chatBody = document.getElementById('chatBody');
  chatBody.innerHTML = `
    <div class="welcome-message">
      <div class="welcome-avatar">🤖</div>
      <div class="welcome-text">
        <strong>Chat cleared! How can I help you?</strong>
        <p>Ask me anything — technology, career, learning, coding, general knowledge, and more.</p>
      </div>
    </div>
  `;
  conversationHistory = [];
}

// ===== EXPAND TOGGLE (Gmail style) =====
function toggleExpand() {
  const chatbox = document.getElementById('chatbox');
  const expandIcon = document.getElementById('expandIcon');
  const collapseIcon = document.getElementById('collapseIcon');
  const btn = document.getElementById('expandBtn');

  chatbox.classList.toggle('expanded');

  if (chatbox.classList.contains('expanded')) {
    if (expandIcon) expandIcon.style.display = 'none';
    if (collapseIcon) collapseIcon.style.display = 'block';
    if (btn) btn.title = 'Collapse';
  } else {
    if (expandIcon) expandIcon.style.display = 'block';
    if (collapseIcon) collapseIcon.style.display = 'none';
    if (btn) btn.title = 'Expand';
  }

  scrollToBottom();
}

// ===== TAB SWITCHING =====
function switchTab(tab) {
  const chatBody = document.getElementById('chatBody');
  const typingIndicator = document.getElementById('typingIndicator');
  const quickTopics = document.getElementById('quickTopics');
  const recommendScreen = document.getElementById('recommendScreen');
  const chatFooter = document.getElementById('chatFooter');
  const tabChat = document.getElementById('tab-chat');
  const tabRecommend = document.getElementById('tab-recommend');

  if (tab === 'chat') {
    if (chatBody) chatBody.style.display = 'flex';
    if (typingIndicator) typingIndicator.style.display = '';
    if (quickTopics) quickTopics.style.display = '';
    if (chatFooter) chatFooter.style.display = '';
    if (recommendScreen) recommendScreen.classList.add('hidden');
    if (tabChat) tabChat.classList.add('active');
    if (tabRecommend) tabRecommend.classList.remove('active');
    scrollToBottom();
  } else {
    if (chatBody) chatBody.style.display = 'none';
    if (typingIndicator) typingIndicator.style.display = 'none';
    if (quickTopics) quickTopics.style.display = 'none';
    if (chatFooter) chatFooter.style.display = 'none';
    if (recommendScreen) recommendScreen.classList.remove('hidden');
    if (tabChat) tabChat.classList.remove('active');
    if (tabRecommend) tabRecommend.classList.add('active');
  }
}

function openRecommendForm() {
  switchTab('recommend');
}

function closeRecommendForm() {
  switchTab('chat');
}

// ===== VOICE INPUT (Web Speech API) =====

let recognition = null;
let isListening = false;

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const rec = new SpeechRecognition();
  rec.continuous = false;        // auto-stop after one utterance
  rec.interimResults = true;     // show live transcript while speaking
  rec.lang = 'en-IN';            // Indian English — change to 'ta-IN' for Tamil

  rec.onstart = () => {
    isListening = true;
    setMicActive(true);
  };

  // Show live interim transcript in the transcript bar
  rec.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += t;
      } else {
        interim += t;
      }
    }
    // Display interim text in the transcript bar
    const transcriptText = document.getElementById('transcriptText');
    if (transcriptText) transcriptText.textContent = final || interim || 'Listening…';

    // Once a final result comes in, put it in the input box
    if (final) {
      const input = document.getElementById('userInput');
      if (input) input.value = final.trim();
    }
  };

  rec.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    let msg = 'Voice input failed.';
    if (event.error === 'not-allowed') msg = 'Microphone access denied. Please allow mic permission.';
    else if (event.error === 'no-speech') msg = 'No speech detected. Please try again.';
    showVoiceError(msg);
    stopVoice();
  };

  // When recognition ends (silence detected or manual stop)
  rec.onend = () => {
    stopVoice();
    // Auto-send if there's text in the input
    const input = document.getElementById('userInput');
    if (input && input.value.trim()) {
      sendMessage();
    }
  };

  return rec;
}

function toggleVoice() {
  if (isListening) {
    stopVoice();
    return;
  }
  startVoice();
}

function startVoice() {
  // Initialise on first use (lazy init so page loads fast)
  if (!recognition) {
    recognition = initSpeechRecognition();
  }

  if (!recognition) {
    showVoiceError('Your browser does not support voice input. Try Chrome.');
    return;
  }

  try {
    const transcriptEl = document.getElementById('voiceTranscript');
    const transcriptText = document.getElementById('transcriptText');
    if (transcriptEl) transcriptEl.classList.remove('hidden');
    if (transcriptText) transcriptText.textContent = 'Listening…';

    // Clear input so user sees fresh transcript
    const input = document.getElementById('userInput');
    if (input) input.value = '';

    recognition.start();
  } catch (e) {
    // recognition might already be running
    stopVoice();
  }
}

function stopVoice() {
  isListening = false;
  setMicActive(false);

  if (recognition) {
    try { recognition.stop(); } catch (_) {}
  }

  const transcriptEl = document.getElementById('voiceTranscript');
  if (transcriptEl) transcriptEl.classList.add('hidden');
}

// Toggle mic button visual state
function setMicActive(active) {
  const btn = document.getElementById('micBtn');
  const pulse = document.getElementById('micPulse');
  if (!btn) return;
  if (active) {
    btn.classList.add('mic-listening');
    if (pulse) pulse.classList.add('pulsing');
    btn.title = 'Stop listening';
  } else {
    btn.classList.remove('mic-listening');
    if (pulse) pulse.classList.remove('pulsing');
    btn.title = 'Speak your question';
  }
}

function showVoiceError(msg) {
  const transcriptEl = document.getElementById('voiceTranscript');
  const transcriptText = document.getElementById('transcriptText');
  if (transcriptEl) transcriptEl.classList.remove('hidden');
  if (transcriptText) transcriptText.textContent = '⚠️ ' + msg;
  setTimeout(() => {
    if (transcriptEl) transcriptEl.classList.add('hidden');
  }, 3000);
}

// ===== TEXT-TO-SPEECH (Browser SpeechSynthesis API — Manual Only) =====

let currentSpeakBtn = null;   // the button currently playing

// Strip markdown to clean plain text for TTS — reads clearly
function plainText(text) {
  return text
    // Remove bold markers ** and *
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    // Remove bullet point asterisks at start of lines
    .replace(/^\s*\*\s+/gm, '')
    // Remove bullet dashes at start of lines
    .replace(/^\s*[-–—]\s+/gm, '')
    // Remove numbered list markers like 1. 2. 3.
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove emoji characters
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FA9F}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{25AA}-\u{25FE}\u{2614}-\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}-\u{26AB}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}-\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}-\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '')
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove special symbols like #, @, >, |, ~, ^, =, +
    .replace(/[#@>|~^=+\[\]{}]/g, '')
    // Remove backticks
    .replace(/`+/g, '')
    // Remove underscores used for markdown
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Replace colons used as separators with pause
    .replace(/:/g, ',')
    // Fix multiple spaces and newlines to single space
    .replace(/\n+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    // Remove leftover punctuation clusters
    .replace(/[,\.]{2,}/g, '.')
    .trim();
}

function speakText(text, btn) {
  if (!window.speechSynthesis) {
    alert('Sorry, your browser does not support Text-to-Speech. Try Chrome.');
    return;
  }

  // If something is already playing, stop it first
  if (currentSpeakBtn) {
    setSpeakBtnState(currentSpeakBtn, false);
    window.speechSynthesis.cancel();
    // If user clicked the same button that was playing, just stop
    if (currentSpeakBtn === btn) {
      currentSpeakBtn = null;
      return;
    }
  }

  const clean = typeof text === 'string' ? text : plainText(text);
  if (!clean) return;

  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = 'en-IN';
  utter.rate = 0.88;   // slightly slower — easier to understand
  utter.pitch = 1.05;  // slightly higher — clearer tone
  utter.volume = 1;

  // Pick best available voice — prefer natural English voices
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
    voices.find(v => v.lang.startsWith('en-IN')) ||
    voices.find(v => v.lang.startsWith('en-GB')) ||
    voices.find(v => v.lang.startsWith('en-US')) ||
    voices.find(v => v.lang.startsWith('en'));
  if (preferred) utter.voice = preferred;

  utter.onend = () => {
    setSpeakBtnState(btn, false);
    currentSpeakBtn = null;
  };
  utter.onerror = () => {
    setSpeakBtnState(btn, false);
    currentSpeakBtn = null;
  };

  setSpeakBtnState(btn, true);
  currentSpeakBtn = btn;
  window.speechSynthesis.speak(utter);
}

// Called when user clicks the 🔊 button on a message
function toggleSpeak(btn) {
  const text = btn.dataset.text || '';
  speakText(text, btn);
}

// Switch button between speaker icon and stop icon
function setSpeakBtnState(btn, playing) {
  if (!btn) return;
  const iconSpeak = btn.querySelector('.icon-speak');
  const iconStop  = btn.querySelector('.icon-stop');
  if (iconSpeak) iconSpeak.style.display = playing ? 'none' : '';
  if (iconStop)  iconStop.style.display  = playing ? ''     : 'none';
  btn.classList.toggle('speak-playing', playing);
  btn.title = playing ? 'Stop' : 'Read aloud';
}

// Pre-load voices (Chrome loads them async)
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
}

// ===== COURSE RECOMMENDATION SYSTEM =====
async function submitRecommendation() {
  const qualification = document.getElementById('rec_qualification').value;
  const interest = document.getElementById('rec_interest').value;
  const skill = document.getElementById('rec_skill').value;
  const goal = document.getElementById('rec_goal').value;

  if (!qualification || !interest || !skill || !goal) {
    alert('Please fill all fields to get recommendations.');
    return;
  }

  switchTab('chat');

  const summaryMsg = `🎯 Finding courses for:\n• Qualification: ${qualification}\n• Interest: ${interest}\n• Skill Level: ${skill}\n• Goal: ${goal}`;
  appendUserMessage(summaryMsg);

  conversationHistory.push({
    role: 'user',
    content: summaryMsg
  });

  showTyping();
  setLoading(true);

  try {
    const response = await fetch('/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qualification, interest, skill, goal })
    });

    const data = await response.json();
    hideTyping();

    const botReply = data.reply || 'Sorry, could not generate recommendations.';
    appendBotMessage(botReply);

    conversationHistory.push({
      role: 'assistant',
      content: botReply
    });

  } catch (err) {
    hideTyping();
    appendBotMessage('Sorry, could not connect. Please try again.', true);
    conversationHistory.pop();
  } finally {
    setLoading(false);
  }
}



// ===== LOCAL STORAGE CHAT HISTORY =====

const HISTORY_KEY = 'ai_chat_history';
const MAX_SESSIONS = 20;

function saveSessionToHistory() {
  if (conversationHistory.length === 0) return;

  const sessions = loadAllSessions();

  // Find today's session or create new one
  const now = new Date();
  const sessionLabel = now.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // Always create a fresh session snapshot (replace if same-minute save)
  const session = {
    id: Date.now(),
    date: sessionLabel,
    messages: [...conversationHistory]
  };

  // Remove any session saved in same minute (de-duplicate rapid saves)
  const filtered = sessions.filter(s => s.date !== sessionLabel);
  filtered.unshift(session);
  if (filtered.length > MAX_SESSIONS) filtered.splice(MAX_SESSIONS);

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
}

function loadAllSessions() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function clearAllHistory() {
  if (!confirm('Delete all saved chat history? This cannot be undone.')) return;
  localStorage.removeItem(HISTORY_KEY);
  renderHistoryPanel(); // refresh panel
}

// ===== THREE-DOT MENU =====

function toggleMenu() {
  const dropdown = document.getElementById('menuDropdown');
  const btn = document.getElementById('menuBtn');
  if (!dropdown || !btn) return;

  const isHidden = dropdown.classList.contains('hidden');

  if (isHidden) {
    // Position dropdown relative to button using fixed coords
    const rect = btn.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 6) + 'px';
    dropdown.style.right = (window.innerWidth - rect.right) + 'px';
    dropdown.style.left = 'auto';
    dropdown.classList.remove('hidden');

    setTimeout(() => {
      document.addEventListener('click', closeMenuOutside, { once: true });
    }, 0);
  } else {
    dropdown.classList.add('hidden');
  }
}

function closeMenuOutside(e) {
  const btn = document.getElementById('menuBtn');
  const dropdown = document.getElementById('menuDropdown');
  if (!dropdown) return;
  if (btn && btn.contains(e.target)) return; // let toggleMenu handle it
  dropdown.classList.add('hidden');
}

function closeMenu() {
  const dropdown = document.getElementById('menuDropdown');
  if (dropdown) dropdown.classList.add('hidden');
}

// ===== IN-CHATBOT HISTORY PANEL =====

function viewChatHistory() {
  closeMenu();
  renderHistoryPanel();
  showHistoryPanel();
}

function showHistoryPanel() {
  const panel = document.getElementById('historyPanel');
  if (panel) panel.classList.remove('hidden');
}

function closeHistoryPanel() {
  const panel = document.getElementById('historyPanel');
  if (panel) panel.classList.add('hidden');
}

function renderHistoryPanel() {
  const body = document.getElementById('historyPanelBody');
  if (!body) return;

  const sessions = loadAllSessions();

  if (sessions.length === 0) {
    body.innerHTML = `
      <div class="history-empty">
        <div style="font-size:2.5rem;margin-bottom:10px;">📭</div>
        <p style="font-weight:600;color:#444;">No chat history yet.</p>
        <p style="font-size:0.82rem;color:#999;margin-top:4px;">Your conversations will appear here after you chat.</p>
      </div>`;
    return;
  }

  body.innerHTML = sessions.map((session, idx) => `
    <div class="hist-session">
      <div class="hist-session-header" onclick="toggleHistSession(${idx})">
        <div class="hist-session-info">
          <span class="hist-session-date">🕒 ${session.date}</span>
          <span class="hist-session-count">${session.messages.length} messages</span>
        </div>
        <span class="hist-chevron" id="hchev-${idx}">▼</span>
      </div>
      <div class="hist-messages hidden" id="hmsgs-${idx}">
        ${session.messages.map(m => `
          <div class="hist-msg ${m.role}">
            <span class="hist-role">${m.role === 'user' ? '🧑 You' : '🤖 AI Assistant'}</span>
            <p>${escapeHtml(m.content.substring(0, 250))}${m.content.length > 250 ? '…' : ''}</p>
          </div>
        `).join('')}
        <div class="hist-session-actions">
          <button class="hist-continue-btn" onclick="continueFromHistory(${idx})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            Continue this Chat
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function toggleHistSession(idx) {
  const msgs = document.getElementById('hmsgs-' + idx);
  const chev = document.getElementById('hchev-' + idx);
  if (!msgs) return;
  msgs.classList.toggle('hidden');
  if (chev) chev.textContent = msgs.classList.contains('hidden') ? '▼' : '▲';
}

// Load an old session back into the active chat so user can continue
function continueFromHistory(idx) {
  const sessions = loadAllSessions();
  const session = sessions[idx];
  if (!session) return;

  // Confirm if current chat has content
  if (conversationHistory.length > 0) {
    if (!confirm('This will replace your current chat with the selected history session. Continue?')) return;
    saveSessionToHistory(); // save current before replacing
  }

  // Restore conversation history array
  conversationHistory = [...session.messages];

  // Rebuild the chat UI
  const chatBody = document.getElementById('chatBody');
  chatBody.innerHTML = `
    <div class="welcome-message">
      <div class="welcome-avatar">🤖</div>
      <div class="welcome-text">
        <strong>Continuing chat from ${session.date}</strong>
        <p>You can keep asking questions right where you left off.</p>
      </div>
    </div>
  `;

  // Re-render all messages visually (suppress auto-save during replay)
  _suppressAutoSave = true;
  session.messages.forEach(m => {
    if (m.role === 'user') {
      appendUserMessage(m.content);
    } else {
      appendBotMessage(m.content);
    }
  });
  _suppressAutoSave = false;

  // Close the history panel and go to chat tab
  closeHistoryPanel();
  switchTab('chat');
  scrollToBottom();
}

// ===== FEEDBACK MODAL =====

let feedbackRating = 0;

function openFeedback() {
  closeMenu();
  feedbackRating = 0;
  updateStars(0);
  const txt = document.getElementById('feedbackText');
  if (txt) txt.value = '';
  const modal = document.getElementById('feedbackModal');
  if (modal) modal.classList.remove('hidden');
}

function closeFeedbackModal() {
  const modal = document.getElementById('feedbackModal');
  if (modal) modal.classList.add('hidden');
}

function setRating(val) {
  feedbackRating = val;
  updateStars(val);
}

function updateStars(val) {
  document.querySelectorAll('#feedbackStars .star').forEach((star, i) => {
    star.classList.toggle('active', i < val);
  });
}

function submitFeedback() {
  const txt = document.getElementById('feedbackText');
  const comment = txt ? txt.value.trim() : '';

  if (feedbackRating === 0) {
    alert('Please select a star rating before submitting.');
    return;
  }

  const feedbacks = JSON.parse(localStorage.getItem('ai_feedback') || '[]');
  feedbacks.push({
    date: new Date().toLocaleString('en-IN'),
    rating: feedbackRating,
    comment
  });
  localStorage.setItem('ai_feedback', JSON.stringify(feedbacks));

  closeFeedbackModal();
  appendBotMessage(`✅ Thank you for your ${feedbackRating}⭐ feedback! Your response has been saved.`);
}

// ===== PATCHED clearChat — save session before clearing =====
const _originalClearChat = clearChat;
function clearChat() {
  saveSessionToHistory();
  _originalClearChat();
}

function clearChatConfirm() {
  closeMenu();
  if (conversationHistory.length === 0) {
    alert('Nothing to clear — the chat is already empty.');
    return;
  }
  if (confirm('Clear the current chat? It will be saved to history first.')) {
    clearChat();
  }
}

// Flag to suppress auto-save during history restore rendering
let _suppressAutoSave = false;

// appendBotMessage: render + auto-save (no patching — calls _renderBotMessage directly)
function appendBotMessage(text, isError = false) {
  _renderBotMessage(text, isError);
  if (!isError && !_suppressAutoSave) {
    setTimeout(saveSessionToHistory, 100);
  }
}

// Also save when page closes
window.addEventListener('beforeunload', () => {
  saveSessionToHistory();
});