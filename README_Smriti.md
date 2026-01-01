# Smriti — Reminiscence App for Senior Citizens

A compassionate memory-enhancement app that uses AI-powered reminiscence therapy to help senior citizens preserve and revisit memories, with family collaboration and progress tracking. Built for accessibility, multilingual support (English, Hindi, Kannada), and easy family involvement.

---

## 🌟 Features

### For Senior Citizens
- **Daily Memory Prompts** — Personalized prompts generated from life history.
- **Multilingual Support** — Add memories in English, हिंदी (Hindi), or ಕನ್ನಡ (Kannada).
- **Audio Recording & Transcription** — Record memories and auto-transcribe (AssemblyAI).
- **Memory Timeline** — Chronologically organized memories with optional AI-generated images.
- **Progress Tracking** — Monthly memory tests + analytics dashboard.
- **Baseline Testing** — Initial memory match game to establish a baseline.
- **Senior-Friendly UI** — Large fonts, high contrast, simple navigation.

### For Family Members
- **Family Groups** — Join a senior’s group via referral link.
- **View Timeline** — See the senior’s memory timeline and AI images.
- **Contribute Memories** — Add memories about the senior.
- **Track Progress** — See analytics and improvements over time.

### Technical Features
- **AI Agents** — LangChain-powered agents for prompt generation & tests.
- **RAG (Retrieval-Augmented Generation)** — ChromaDB for context-aware prompts.
- **Embeddings & Vector Store** — Store user history for personalization.
- **Image Generation** — AI-generated images for memories.
- **Auto-Translation** — Converts non-English inputs to English for storage & search.
- **Scheduled Jobs** — Daily prompt generation (cron).

---

## 🎨 Design & Accessibility
- **Indian Heritage Theme** — Saffron, gold, terracotta accents.
- **Traditional Patterns** — Subtle background motifs for warmth.
- **Accessibility** — High contrast, large touch targets (48px+), Noto fonts.
- **Responsive** — Mobile-first design for easy access.

---

## 🛠️ Tech Stack
- **Backend:** Node.js (Express)
- **Database:** MongoDB Atlas
- **Vector DB:** ChromaDB Cloud (fallback in-memory)
- **AI / ML:** LangChain, Google Gemini (LLM), image generator
- **Transcription:** AssemblyAI
- **Translation:** Google Cloud Translation API
- **Auth:** JWT w/ bcrypt
- **File Uploads:** Multer
- **Scheduling:** node-cron
- **Frontend:** React (Vite)
- **Charts:** Recharts, Animations: Framer Motion

---

## 📋 Prerequisites
- Node.js v18+ and npm or yarn
- MongoDB Atlas account (free tier OK)
- Google Cloud account (Gemini & Translation API keys)
- AssemblyAI API key
- ChromaDB Cloud (optional)

---

## 🚀 Installation

1. Clone the repo
```bash
git clone <your-repo-url>
cd Smriti
```

2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys and connection strings
```

3. Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
# Edit VITE_API_URL if needed
```

---

## ⚙️ Configuration (important env vars)

backend/.env (example)
```
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/reminiscence
JWT_SECRET=your_jwt_secret
GOOGLE_API_KEY=your_google_gemini_api_key
GOOGLE_TRANSLATE_API_KEY=your_translate_api_key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
CHROMADB_URL=https://api.trychroma.com
CHROMADB_API_KEY=your_chroma_key
FRONTEND_URL=http://localhost:5173
UPLOAD_DIR=./uploads
```

frontend/.env
```
VITE_API_URL=http://localhost:5001/api
```

---

## 🏃 Running Locally

**Backend (dev)**
```bash
cd backend
npm run dev
# Server: http://localhost:5001
```

**Frontend (dev)**
```bash
cd frontend
npm run dev
# App: http://localhost:5173
```

**Production**
- Backend: `npm start` (or use a process manager)
- Frontend: `npm run build` → `npm run preview` (or deploy to Vercel/Netlify)

---

## 📱 Usage Guide (high level)
- Senior signs up and completes a short profile + baseline memory game.
- Family joins with referral link and can contribute memories.
- Seniors get daily prompts at 6 AM and can respond via text or audio.
- Monthly tests are auto-generated and analytics are available in the dashboard.

---

## 🧪 Testing & API Health
- API health: `GET /api/health`
- Manual checklist: sign-up, referral, memory submission, timeline, tests, analytics.
- Recommended: write integration tests for major flows (auth, memory submit, prompt generation).

---

## 📁 Project Structure (suggested)
```
Smriti/
├─ backend/
│  ├─ models/
│  ├─ routes/
│  ├─ services/ (aiAgents/)
│  ├─ middleware/
│  ├─ jobs/
│  └─ server.js
├─ frontend/
│  ├─ src/components/
│  ├─ src/pages/
│  └─ index.html
└─ README_Smriti.md
```

---

## 🚢 Deployment
- Backend: Railway, Render, or a VPS (set env vars)
- Frontend: Vercel or Netlify (set VITE_API_URL)
- Monitor: set up basic logging and alerts (Sentry/Logflare)

---

## 🤝 Contributing
- Fork → feature branch → PR → review.
- Please add tests and update the API docs for new endpoints.

---

## 📄 License
MIT License

---

## ❤️ Acknowledgments
- Google Gemini, AssemblyAI, ChromaDB, MongoDB, open-source libraries

---

If you want, I can:
- Add this README to the repository (I will create `README_Smriti.md`),
- Add a `.github/ISSUE_TEMPLATE` and a basic contribution guide,
- Commit & push to your GitHub remote if you give the remote name.

Tell me which of these you'd like me to do next.