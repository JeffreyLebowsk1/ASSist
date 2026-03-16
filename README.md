# ASSist — Modular Digital Work Assistant

A privacy-first, modular work assistant for Google Workspace power users, purpose-built for roles handling sensitive PII and FERPA-protected student records (e.g., Graduation Coordinator, Registrar staff).

Runs as an app server on **Jetson Orin Nano 8G** (ARM64) or any Linux machine.

---

## ✨ Features

### 🎓 Registrar Toolkit
Purpose-built for graduation coordinators and registrar staff:
- **Task checklists** for graduation applications, ceremony coordination, transcript processing, and admissions — with progress tracking per category
- **Email templates** for common registrar communications (graduation confirmation, transcript ready, missing docs, ceremony info) — one-click copy to clipboard

### 📋 PII Clipboard *(session-only, client-side)*
Stop typing the same student data into dozens of forms:
- Add student records (name, ID, DOB, email, phone, program, major, address, etc.) for the current work session
- One-click **copy any field** to your system clipboard — paste directly into SIS, forms, emails
- Quick-combination fields: Full Name, Last-First, Full Address, Name + ID
- Supports multiple students simultaneously (tabbed)
- **Zero server storage** — all data lives in browser RAM, wiped on logout or tab close

### 🛡️ PII Redactor *(100% client-side)*
Create safe sample documents, training materials, and screenshots:
- **Redact** mode: Replace PII with `[TYPE REDACTED]` labels
- **Scramble** mode: Replace with realistic fake data (fake names, IDs, DOBs, addresses) — perfect for sample docs and screenshots
- **Remove** mode: Delete PII entirely
- Detects: SSNs, email addresses, phone numbers, dates of birth, student IDs (7–9 digits), GPAs, street addresses
- Toggle individual detection patterns on/off
- Shows match statistics (how many of each type were found)
- **Text never leaves your browser** — FERPA-safe by design

### 🤖 AI Assistant *(session-scoped, no persistent memory)*
- Chat assistant pre-instructed for Registrar/higher-ed work
- Supports **Ollama** (local, recommended for privacy — data stays on device), **OpenAI**, or **Google Gemini**
- Conversation history lives in server-side session RAM only — wiped on logout
- Useful for: drafting emails, summarizing documents, checking policy questions, composing letters
- Reminds you of data-handling policies when sensitive info is detected

### ✉️ Gmail Module
- Browse inbox, search mail, view message details
- Create drafts without leaving the app

### 📁 Google Drive Module
- Browse and search Drive files
- Open Docs/Sheets/Slides directly
- Export Google Docs as plain text for AI processing

---

## 🔒 Security & Privacy Design

| Concern | Approach |
|---------|----------|
| PII in memory | Session data stored in **RAM only** — no disk writes |
| PII in logs | Access logs and request body logging **disabled** |
| Session expiry | Sessions auto-expire after 1 hour of inactivity |
| Logout | Destroys server session + revokes Google token |
| CSRF | OAuth state parameter validation |
| Clickjacking | `X-Frame-Options: DENY` header |
| CORS | Restricted to configured frontend origin only |
| PII tools | Client-side only — student data **never sent to server** |
| AI memory | No conversation persistence — history cleared on logout |
| Source maps | Disabled in production builds |
| API exposure | Docs/OpenAPI disabled in production |
| Container | Runs as non-root user in Docker |

> **FERPA compliance note:** This application does not transmit student record data to third-party services unless you configure the AI backend as OpenAI or Gemini. For maximum FERPA compliance, use the local **Ollama** backend.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- A Google Cloud project with OAuth2 credentials
- (Optional but recommended) [Ollama](https://ollama.com) installed locally

### 1. Google OAuth2 Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable these APIs: **Gmail API**, **Google Drive API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Authorized redirect URI: `http://localhost:8000/auth/callback`
7. Copy the **Client ID** and **Client Secret**

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env and fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SECRET_KEY
# Generate a secret key: python -c "import secrets; print(secrets.token_urlsafe(32))"

pip install -r requirements.txt
python -m app.main
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local: VITE_API_URL=http://localhost:8000

npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — sign in with Google.

### 4. AI Setup (Local — Recommended)
```bash
# Install Ollama: https://ollama.com/download
ollama pull llama3
# Then set in backend .env:
# AI_BACKEND=ollama
# OLLAMA_MODEL=llama3
```

---

## 🐳 Docker (Recommended for Jetson)

```bash
cd /path/to/ASSist
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

docker compose up -d
```

Frontend: http://localhost:5173  
Backend API: http://localhost:8000

### Jetson Orin Nano Notes
- The Docker image uses `python:3.11-slim` and `nginx:alpine` — both have ARM64 builds
- Build on-device: `docker compose build` (takes ~5 min first time)
- Or build on x86 with `--platform linux/arm64` and push to a registry
- Ollama also runs natively on Jetson — use `AI_BACKEND=ollama` for on-device inference
- Recommended: run Ollama as a separate systemd service alongside the Docker stack

---

## 📁 Project Structure

```
ASSist/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, middleware, routers
│   │   ├── config.py            # Pydantic settings (env-based)
│   │   ├── middleware/
│   │   │   └── security.py      # Security headers, no-PII-logging middleware
│   │   ├── routers/
│   │   │   ├── auth.py          # Google OAuth2 flow
│   │   │   ├── ai_assistant.py  # AI chat (session-scoped history)
│   │   │   ├── gmail.py         # Gmail API integration
│   │   │   └── gdrive.py        # Google Drive/Docs integration
│   │   └── services/
│   │       ├── session_manager.py  # In-memory session store
│   │       ├── google_auth.py      # OAuth2 token exchange
│   │       └── ai_service.py       # Multi-backend AI (Ollama/OpenAI/Gemini)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Root component, routing
│   │   ├── types/               # Shared TypeScript types
│   │   ├── hooks/
│   │   │   ├── useAuth.ts       # Auth state management
│   │   │   └── useModule.ts     # Module navigation
│   │   └── components/
│   │       ├── Layout/          # Sidebar, header
│   │       ├── ModuleContainer/ # Reusable module wrapper
│   │       ├── LoginPage/       # Google OAuth sign-in page
│   │       └── modules/
│   │           ├── Dashboard/          # Home screen
│   │           ├── RegistrarDashboard/ # 🎓 Checklists + templates
│   │           ├── PIIClipboard/       # 📋 One-click student data copying
│   │           ├── PIIRedactor/        # 🛡️ Client-side PII redact/scramble
│   │           ├── AIAssistant/        # 🤖 Chat interface
│   │           ├── GmailModule/        # ✉️ Gmail integration
│   │           └── GDriveModule/       # 📁 Drive integration
│   ├── Dockerfile
│   ├── nginx.conf
│   └── vite.config.ts
└── docker-compose.yml
```

---

## 🔧 Configuration Reference

### Backend `.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Session signing key (generate a strong random one!) | auto-generated |
| `SESSION_MAX_AGE` | Session timeout in seconds | `3600` |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID | required |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret | required |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | `http://localhost:8000/auth/callback` |
| `AI_BACKEND` | AI provider: `ollama`, `openai`, `gemini` | `ollama` |
| `OLLAMA_BASE_URL` | Ollama server URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model name | `llama3` |
| `OPENAI_API_KEY` | OpenAI API key (if using OpenAI) | — |
| `GEMINI_API_KEY` | Google Gemini API key (if using Gemini) | — |
| `ALLOWED_ORIGINS` | Frontend CORS origins (JSON array) | `["http://localhost:5173"]` |
| `DEBUG` | Enable debug mode (enables API docs) | `false` |

---

## 🧩 Adding New Modules

The app is designed to be modular. To add a new module:

1. **Create** `frontend/src/components/modules/YourModule/index.tsx` and wrap it with `<ModuleContainer>`.
2. **Add** your module ID to `ModuleId` in `src/types/index.ts`.
3. **Add** a config entry in `MODULE_CONFIGS` in `src/hooks/useModule.ts`.
4. **Add** a case to the `ModuleView` switch in `src/App.tsx`.
5. (Optional) **Add** backend routes in `backend/app/routers/your_module.py` and include in `main.py`.

---

## 📜 License

MIT — see [LICENSE](LICENSE)

