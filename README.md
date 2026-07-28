# AssessAI

AI-powered Assessment & Hiring Platform — create, manage, and take assessments with AI-generated questions, real-time code execution, and smart analytics.

## Features

- **AI Question Generation** — Generate MCQ, coding, and subjective questions using GPT, Gemini, Claude, Groq, or DeepSeek
- **Multi-language Code Execution** — Run JavaScript, Python, Java, C++, and C via Judge0 CE (zero local dependencies)
- **Smart Assessments** — Timed quizzes with proctoring, auto-grading, and detailed analytics
- **Coding Workspace** — LeetCode-style editor with Monaco, AI chat, per-language code persistence
- **Role-based Access** — Candidate, Setter, and Admin dashboards with RBAC
- **Real-time Analytics** — Performance insights, leaderboards, and AI-powered recommendations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind v4, Redux Toolkit, TanStack Query, Monaco Editor |
| Backend | Express 4, Mongoose 8, Redis, Socket.io |
| Auth | JWT (access + refresh tokens), bcrypt |
| AI | Gemini, GPT, Claude, DeepSeek, OpenRouter, Groq, NVIDIA |
| Code Execution | Judge0 CE API (remote) |
| Testing | Playwright E2E |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional, for caching)

### Installation

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Setup

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secrets, and AI provider API keys
```

### Running

```bash
# Terminal 1 — Server
cd server
npm run dev

# Terminal 2 — Client
cd client
npm run dev
```

Server runs on `http://localhost:5000`, client on `http://localhost:5173`.

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── features/       # Feature modules (auth, coding, assessments, etc.)
│   │   ├── components/     # Shared UI components
│   │   ├── layouts/        # Dashboard & auth layouts
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities & API client
│   │   └── store/          # Redux store
│   └── public/             # Static assets
├── server/                 # Express backend
│   └── src/
│       ├── modules/        # Feature modules (auth, ai, coding, etc.)
│       ├── middleware/      # Auth, validation, error handling
│       ├── config/         # Database, cache, logger setup
│       └── shared/         # Shared utilities
└── package.json            # Root scripts
```

## License

MIT
