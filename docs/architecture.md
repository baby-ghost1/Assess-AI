# Architecture

## Architecture Style

- **Feature-First Architecture** — Code organized by feature domain
- **Modular Monolith** (initially) — All services in a single deployable unit
- **Microservice-Ready** — Each module is designed as an independent bounded context with clear interfaces, making extraction into separate services straightforward
- **Client-Server Model** — REST API with WebSocket for real-time features
- **JWT Authentication** — Access + Refresh token pattern
- **Role-Based Access Control (RBAC)** — Granular permissions per role

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 18+ | UI Framework |
| Vite | Build tool |
| Redux Toolkit | Global state management |
| TanStack Query (React Query) | Server state & caching |
| Tailwind CSS | Utility-first styling |
| Framer Motion | Animations |
| React Hook Form | Form handling |
| Zod | Schema validation |
| React Router v6 | Routing |
| Socket.io Client | Real-time (proctoring) |
| Monaco Editor | Code editor (coding assessment) |

### Backend

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | HTTP framework |
| MongoDB | Primary database |
| Mongoose | ODM |
| Redis | Caching, queues, session store |
| BullMQ | Job queues (email, AI generation, code execution) |
| Socket.io | Real-time communication |
| JWT (jsonwebtoken) | Authentication |
| Multer | File uploads |
| Cloudinary SDK | Image/file upload management |
| AWS SDK (S3) | File storage (future-ready) |
| Bcrypt | Password hashing |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |
| cors | CORS middleware |
| Zod | API validation |
| Winston | Logging |
| Jest / Supertest | Testing |

## Folder Structure

```
/
├── AI_AGENT_PROMPT.md
├── docs/
│   ├── project-requirements.md
│   ├── architecture.md
│   ├── rules.md
│   ├── phases.md
│   ├── design.md
│   └── memory.md
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/        # Shared UI components
│   │   │   ├── ui/            # Base UI (Shadcn)
│   │   │   └── shared/        # Reusable domain components
│   │   ├── features/          # Feature-based modules
│   │   │   ├── auth/
│   │   │   ├── quiz/
│   │   │   ├── coding/
│   │   │   ├── ai-quiz/
│   │   │   ├── proctoring/
│   │   │   ├── question-bank/
│   │   │   ├── admin/
│   │   │   ├── analytics/
│   │   │   └── leaderboard/
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities, API client
│   │   ├── store/             # Redux store
│   │   ├── utils/             # Utility functions
│   │   └── layouts/           # Layout components
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── jsconfig.json
├── server/
│   ├── src/
│   │   ├── config/            # App configuration
│   │   ├── middleware/        # Express middleware
│   │   ├── modules/           # Feature-based modules
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── roles/
│   │   │   ├── questions/
│   │   │   ├── assessments/
│   │   │   ├── attempts/
│   │   │   ├── coding/
│   │   │   ├── ai/
│   │   │   ├── proctoring/
│   │   │   ├── analytics/
│   │   │   ├── notifications/
│   │   │   └── admin/
│   │   ├── shared/            # Shared utilities
│   │   │   ├── errors/
│   │   │   ├── validation/
│   │   │   └── utils/
│   │   └── app.js             # Express app setup
│   ├── package.json
│   └── .env.example
├── shared/                    # Shared between client and server
│   ├── constants/
│   └── validation/
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## API Layers (Server)

```
Request
  → Middleware (auth, validation, rate-limit)
    → Controller (parse request, send response)
      → Service (business logic)
        → Repository (data access / external APIs)
          → Model (Mongoose schema)
```

### Responsibility

| Layer | Responsibility |
|-------|---------------|
| Controller | HTTP request parsing, response formatting, status codes |
| Service | Business logic, orchestration, validation |
| Repository | Database operations, external service calls |
| Model | Schema definition, indexes, virtuals, methods |
| Middleware | Auth, authorization, validation, logging, error handling |

## API Design

### Conventions

- RESTful endpoints `/api/v1/{resource}`
- Plural resource names: `/api/v1/users`
- Nested resources for relations: `/api/v1/assessments/:id/attempts`
- Versioned API (`/api/v1/`)
- Consistent response envelope:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "errors": null,
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email" }
  ],
  "meta": null
}
```

## Database Collections

| Collection | Description |
|-----------|-------------|
| users | User accounts and profiles |
| roles | Role definitions |
| permissions | Permission mappings |
| questions | Question bank |
| question_versions | Version history for questions |
| assessments | Quiz and coding assessment configurations |
| attempts | Candidate assessment attempts |
| submissions | Question-level answers |
| coding_submissions | Code submissions with results |
| violations | Proctoring violation logs |
| settings | System configuration (key-value) |
| violation_screenshots | Screenshot evidence |
| ai_quizzes | AI-generated quiz configurations |
| ai_generation_logs | AI request/response logs |
| analytics | Aggregated analytics data |
| notifications | In-app notifications |
| email_templates | Email template configurations |
| audit_logs | System audit trail |
| bookmarks | Candidate bookmarks |
| notes | Candidate notes during assessment |
| sessions | Active session tracking |

## Security Architecture

- **Helmet.js** — HTTP security headers
- **Rate Limiter** — Per-IP and per-endpoint rate limiting
- **CORS** — Configurable allowed origins
- **CSRF** — Token-based CSRF protection for state-changing requests
- **Audit Logs** — All admin/privileged actions logged
- **Encryption** — Data encrypted at rest (database encryption) and in transit (TLS)
- **Password Hashing** — bcrypt with salt rounds (12)
- **JWT** — Short-lived access tokens (15min) + long-lived refresh tokens (7 days)
- **Refresh Token Rotation** — New refresh token issued on each refresh
- **Session Management** — Track active sessions, allow revocation
- **Input Validation** — Zod schemas for all API inputs
- **File Upload Validation** — File type, size, and content validation

## Real-time Architecture (Socket.io)

```
Client → Socket.io (WebSocket) → Server

Events:
- proctoring:frame       Camera frame data
- proctoring:violation   Violation event
- proctoring:status      Proctoring status update
- assessment:time        Timer sync
- assessment:autosave    Auto-save answers
- notification:new       Real-time notification
```

## AI Provider Abstraction

```
AI Service Interface
  ├── GeminiProvider
  ├── OpenAIProvider
  ├── ClaudeProvider
  ├── DeepSeekProvider
  ├── OpenRouterProvider
  ├── PerplexityProvider
  └── GroqProvider

Each provider implements:
  - generateQuestions(topic, config)
  - generateQuiz(topic, config)
  - evaluateAnswer(answer, context)
  - generateInsights(data)
```

## Caching Strategy

- **Redis** for:
  - Session store
  - Question bank cache (frequently accessed)
  - Assessment configuration cache
  - Rate limiter store
  - BullMQ job queue
- **TanStack Query** for:
  - Client-side caching and stale-while-revalidate
  - Automatic background refetching
  - Optimistic updates

## Scalability Considerations

- Stateless API servers (scale horizontally)
- Redis as central cache and session store
- MongoDB indexing strategy
- Database read replicas for analytics queries
- CDN for static assets (Vite build output)
- BullMQ for async task processing
- Microservice-ready bounded contexts

## Microservice Boundary Candidates (Future)

| Service | Responsibility |
|---------|---------------|
| Auth Service | Authentication, authorization, RBAC |
| Assessment Service | Quiz and coding assessment management |
| AI Service | AI question generation, evaluation, insights |
| Proctoring Service | Real-time proctoring, violation detection |
| Code Execution Service | Sandboxed code execution |
| Analytics Service | Data aggregation, reporting |
| Notification Service | Email, in-app, push notifications |
| File Service | File upload, storage management |
