"""
General Purpose AI Chatbot Backend
Uses Groq API (FREE) with llama-3.3-70b model.
Sign up free at: https://console.groq.com
"""

import os
from groq import Groq
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='.')
CORS(app)

client = Groq(
    api_key=os.environ.get("Your_grok_APIKEY")
)

SYSTEM_PROMPT = """You are a helpful, friendly, and knowledgeable AI Assistant.
You assist users with a wide range of topics including technology, education, science, general knowledge, career guidance, programming, and everyday questions.

VERY IMPORTANT MEMORY RULE:
You MUST remember the full conversation history. When a user replies with just a number like "1", "2", or "3", you MUST look at your PREVIOUS message in the conversation and understand what option they are selecting.
Never ask them to repeat or clarify what they were asking about. Always use the conversation context.

Example:
- You asked: "There are 3 options. Which one? 1) Option A  2) Option B  3) Option C"
- User says: "2"
- You MUST answer: Full details about Option B
- You must NEVER say "I don't know what you're referring to"

==============================
RESPONSE RULES
==============================
1. MOST IMPORTANT: Always use conversation history. When user replies "1", "2", or "3" — look at your previous message and answer that specific option fully.
2. When user says "all" — give complete details of all options from your previous question.
3. Be warm, friendly, and encouraging in every response.
4. Use bullet points and numbered lists for clarity when listing multiple items.
5. Never ask more than one clarifying question at a time.
6. When a question is ambiguous, ask a brief clarifying question before answering.
7. Always end with: "Would you like to know more? Feel free to ask!"
8. Answer in clear, simple language suitable for all users.
9. If you are unsure about something, say so honestly rather than guessing.
10. For sensitive topics (medical, legal, financial), always recommend consulting a qualified professional.
"""


@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'reply': 'Invalid request.'})

        user_message = data.get('message', '').strip()
        history = data.get('history', [])

        if not user_message:
            return jsonify({'reply': 'Please send a message.'})

        print(f"User: {user_message}")

        # Build messages with full conversation history
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add conversation history (max last 20 messages to avoid token limit)
        for msg in history[-20:]:
            role = msg.get('role', '')
            content = msg.get('content', '')
            if role in ['user', 'assistant'] and content:
                messages.append({"role": role, "content": content})

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=1024,
            messages=messages
        )

        reply_text = response.choices[0].message.content

        if not reply_text.strip():
            reply_text = "I'm sorry, I couldn't generate a response. Please try rephrasing your question."

        print(f"Bot replied OK")
        return jsonify({'reply': reply_text.strip()})

    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")
        return jsonify({'reply': f'Error: {str(e)}'}), 500


# ===== ML RECOMMENDATION ENDPOINT =====
@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        from recommender import get_recommendations, format_recommendations
        data = request.get_json()
        qualification = data.get('qualification', '')
        interest = data.get('interest', '')
        skill = data.get('skill', '')
        goal = data.get('goal', '')

        if not all([qualification, interest, skill, goal]):
            return jsonify({'reply': 'Please fill all fields.'})

        courses, method = get_recommendations(qualification, interest, skill, goal)
        formatted = format_recommendations(courses, qualification, interest, skill, goal)

        ai_prompt = f"""A user has the following profile:
- Qualification: {qualification}
- Interest: {interest}
- Skill Level: {skill}
- Career Goal: {goal}

Our recommendation system suggests these learning paths:
{formatted}

Please present these recommendations in a warm, encouraging, and easy-to-understand way.
Keep all details accurate. Add a brief note on why each option suits this user.
Always include any relevant links at the end."""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=1024,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": ai_prompt}
            ]
        )
        reply = response.choices[0].message.content
        print(f"Recommendation generated using {method} method")
        return jsonify({'reply': reply})

    except Exception as e:
        print(f"Recommend Error: {type(e).__name__}: {e}")
        return jsonify({'reply': f'Error generating recommendations: {str(e)}'}), 500


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/feedback-admin')
def feedback_admin():
    return send_from_directory('.', 'feedback.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)


if __name__ == '__main__':
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("\n WARNING: GROQ_API_KEY not set!")
        print(" Get free key at: https://console.groq.com")
        print(" In PowerShell: $env:GROQ_API_KEY='your-key-here'\n")
    else:
        print(f"\n✅ Groq API Key found: {api_key[:12]}...\n")

    print("🚀 AI Chatbot Server starting at http://127.0.0.1:5000\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
