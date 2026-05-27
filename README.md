# AI Assistant Chatbot

A general-purpose AI-powered chatbot built with Flask (Python) and Groq API. It supports open-ended conversations on any topic — technology, education, career guidance, programming, general knowledge, and more.

## Features

- **General Purpose AI Chat** — Conversational AI powered by LLaMA 3.3 70B via Groq
- **Full Conversation Memory** — Remembers the full chat context; handles numbered replies (e.g. "1", "2") referencing previous options
- **Voice Input** — Speak your questions using the Web Speech API (Chrome recommended)
- **Text-to-Speech** — Each bot message has a "Read Aloud" button
- **ML-Powered Recommendation System** — Rule-based + KNN machine learning to suggest personalised learning paths
- **Expand / Collapse** — Resize the chat window (Gmail-style)
- **Chat History** — Auto-saves sessions to localStorage; view, continue, or clear old chats
- **Feedback System** — Star rating + comments saved locally; admin dashboard at `/feedback-admin`
- **Quick Topic Chips** — Pre-set topic shortcuts for fast navigation
- **Floating Dropdown Menu** — Access history, feedback, and clear chat

---

## Setup

### 1. Get a Free Groq API Key

Sign up at **https://console.groq.com** — completely free.

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Your API Key

**Windows (PowerShell):**
```powershell
$env:GROQ_API_KEY="your-key-here"
```

**Mac/Linux:**
```bash
export GROQ_API_KEY="your-key-here"
```

Or create a `.env` file:
```
GROQ_API_KEY=your-key-here
```

### 4. Run the Server

```bash
python app.py
```

Open your browser and go to: **http://127.0.0.1:5000**

---

## Customising the Bot

To make this chatbot specific to your domain (e.g. a company, school, or service), edit the `SYSTEM_PROMPT` inside `app.py`. Add:
- Your organisation's name and description
- FAQs or key information the bot should know
- Response style and tone guidelines

To update the Recommendation System courses/topics, edit `courses_data.py`.

---

## File Structure

```
├── app.py              # Flask backend + Groq AI integration
├── courses_data.py     # Learning paths dataset for recommendation engine
├── recommender.py      # Rule-based + KNN recommendation logic
├── index.html          # Main chatbot UI
├── feedback.html       # Admin feedback dashboard
├── script.js           # Frontend JavaScript (all features)
├── style.css           # Styling (colours, fonts, layout)
├── requirements.txt    # Python dependencies
└── README.md           # This file
```

---

## Tech Stack

- **Backend:** Python, Flask, Flask-CORS
- **AI Model:** LLaMA 3.3 70B via Groq API (free tier available)
- **ML:** scikit-learn KNN, NumPy
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Voice:** Web Speech API (browser-native)
- **Storage:** Browser localStorage (no database needed)
