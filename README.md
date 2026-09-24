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

## Load Test Results

Tested with **1000 concurrent users** for 60 seconds using [autocannon](https://github.com/mcollina/autocannon).

### Without Redis Caching

| Endpoint | Total Requests | Errors | 5xx | Avg Latency | p50 | p99 | Req/sec |
|----------|---------------|--------|-----|-------------|-----|-----|---------|
| `GET /api/health` | 518,152 | 0 | 0 | 115ms | 108ms | 254ms | 8,636 |
| `GET /api/v1/tags` | 121,289 | 5,474 | 0 | 2,630ms | 483ms | 23,617ms | 2,021 |
| `GET /api/v1/assessments` | 123,961 | 3,736 | 0 | 1,819ms | 484ms | 23,072ms | 2,066 |

### With Redis Caching

| Endpoint | Total Requests | Errors | 5xx | Avg Latency | p50 | p99 | Req/sec |
|----------|---------------|--------|-----|-------------|-----|-----|---------|
| `GET /api/health` | 471,996 | 0 | 0 | 126ms | 121ms | 251ms | 7,866 |
| `GET /api/v1/tags` | 122,555 | 0 | 0 | 487ms | 451ms | 1,029ms | 2,042 |
| `GET /api/v1/assessments` | 122,661 | 0 | 0 | 487ms | 451ms | 1,033ms | 2,044 |

### Verdict

| Metric | Without Redis | With Redis | Improvement |
|--------|--------------|------------|-------------|
| Tags p99 latency | 23,617ms | 1,029ms | **95.6% faster** |
| Assessments p99 latency | 23,072ms | 1,033ms | **95.5% faster** |
| Tags connection errors | 5,474 | 0 | **100% fewer** |
| Assessments connection errors | 3,736 | 0 | **100% fewer** |
| 5xx errors (all endpoints) | 0 | 0 | Stable |
| 1000+ concurrent users | Handled | Handled | **PASS** |

- Server handles **1000+ concurrent users** with **zero 5xx errors** in both configurations
- Redis caching eliminates connection timeouts and reduces p99 latency by **~95%** on DB-backed endpoints
- Rate limiter (`express-rate-limit`) provides additional protection against traffic spikes

## License

MIT
