# Project Requirements

## 1. Vision

To build a comprehensive AI-powered Assessment & Hiring Platform that goes beyond traditional quiz applications. The platform will support coding assessments, AI-generated quizzes, automated proctoring, and analytics — serving as a one-stop solution for skill evaluation and hiring.

## 2. Goals

- Provide a seamless assessment experience for candidates
- Enable organizations to create, manage, and evaluate assessments efficiently
- Leverage AI for question generation, insights, and proctoring
- Build a scalable, modular, and production-ready platform
- Support multiple assessment types: quizzes, coding challenges, and future interview modules

## 3. Target Users

- Students and learners
- Job seekers and candidates
- Educators and trainers
- Recruiters and HR professionals
- Organizations and companies
- Coding bootcamps and educational institutions

## 4. Roles

| Role | Description |
|------|-------------|
| Guest | Unauthenticated user with limited access |
| Candidate | Can attempt assessments, view results, and track progress |
| Problem Setter | Creates and manages question banks, imports content |
| Reviewer | Approves, rejects, or suggests edits to questions |
| Admin | Full system administration, user management, configuration |
| Super Admin | Highest level access, system-wide settings, audit |

### Guest

- Browse public assessments
- Register / Login
- View platform information

### Candidate

- Attempt quiz assessments
- Attempt coding assessments
- Generate AI-powered quizzes
- Review answers and AI insights
- Download reports (PDF)
- View leaderboard
- Access previous attempts
- Resume incomplete assessments
- Bookmark questions
- Take notes during assessments

### Problem Setter

- Upload content for question generation:
  - PDF, DOCX, TXT, JSON, CSV, Images, Excel
- AI extracts questions from uploaded content
- Edit AI-generated questions
- Regenerate questions
- Tag and categorize questions
- Preview questions before publishing
- Publish questions to question bank
- Send questions for reviewer approval

### Reviewer

- Approve questions
- Reject questions
- Suggest edits to questions
- View version history of questions

### Admin

- Manage users (CRUD, roles, status)
- Manage roles and permissions
- Manage question banks
- Manage assessments
- Manage subscriptions and billing
- Configure AI models
- Manage email templates
- View reports and analytics
- View audit logs
- System configuration

### Super Admin

- All Admin permissions
- System-wide settings
- Platform maintenance
- Access to all audit logs
- Manage other admins

## 5. Functional Requirements

### Authentication & Authorization

- Email/password registration and login
- Google OAuth, GitHub OAuth
- Email verification
- Password reset flow
- JWT-based authentication (access + refresh tokens)
- Role-based access control (RBAC)
- Session management
- Multi-device login handling

### Question Bank

- CRUD operations for questions
- Multiple question types:
  - Single Correct (MCQ)
  - Multiple Correct
  - True/False
  - Fill in the Blanks
  - Coding Questions
  - Subjective / Essay
- Tagging and categorization
- Difficulty levels (Easy, Medium, Hard, Expert)
- Bulk import / export
- Version control for questions
- Approval workflow (Problem Setter -> Reviewer)

### Quiz Assessment

- Configurable quizzes (time, questions, passing criteria)
- Timer with auto-submit
- Randomization of questions and options
- Section-wise quiz support
- Negative marking (configurable)
- Partial marking for multi-correct questions
- Resume support for incomplete attempts
- Bookmark questions during quiz
- Notes during quiz

### Coding Assessment

- LeetCode-style interface
  - Question description on left
  - Code editor on right
- Supported languages:
  - C++, Java, Python, JavaScript, TypeScript, Go, Rust, C#
- Run code against sample test cases
- Submit code against hidden test cases
- Execution time and memory metrics
- Compilation error display
- Console output
- Code autosave

### AI Quiz Generation

- Candidate selects:
  - Topic / Subject
  - Difficulty level
  - Language
  - Number of questions
  - Question type (single, multi, mixed)
  - Time limit
  - AI Model (Gemini, GPT, Claude, DeepSeek, etc.)
- AI generates questions dynamically
- Questions are unique per attempt
- AI models are pluggable via abstraction layer

### AI Proctoring

- Webcam monitoring
- Microphone monitoring
- Tab switching detection
- Multiple faces detection
- No face detection
- Phone detection
- Looking away detection
- Eye tracking (gaze estimation)
- Head pose estimation
- Background noise detection
- Clipboard monitoring
- Keyboard event logging
- Mouse event logging
- Network disconnect detection
- Browser fullscreen enforcement
- Violation counter with thresholds
- Auto-submit on high violations
- Audit report generation

### Analytics & Reports

- Candidate performance analytics
- AI-powered insights (strengths, weaknesses, recommendations)
- Question-wise analytics (difficulty, discrimination, time taken)
- Assessment analytics (pass rate, avg score, completion rate)
- Downloadable reports (PDF, CSV)
- Exportable data for external analysis

### Leaderboard

- Assessment-wise leaderboard
- Global leaderboard
- Filter by date, difficulty, category
- Rank calculation based on score + time

### Notifications

- Email notifications (results, invitations, reminders)
- In-app notifications
- Push notifications (future)

### Admin Panel

- Dashboard with key metrics
- User management
- Role & permission management
- Question bank management
- Assessment management
- AI model configuration
- Email template editor
- System settings
- Audit log viewer
- Report generation

## 6. Non-Functional Requirements

### Performance

- Page load time < 2 seconds
- API response time < 500ms (p95)
- Support 1000+ concurrent users initially
- Scalable to 10000+ concurrent users
- Code execution timeout: 5s (configurable)
- Real-time updates via WebSockets for proctoring

### Security

- OWASP Top 10 compliance
- Helmet.js for HTTP headers
- Rate limiting on APIs
- CORS configuration
- CSRF protection
- XSS prevention
- SQL/NoSQL injection prevention
- Input validation and sanitization
- Audit logging for sensitive operations
- Encryption at rest and in transit
- Secure password hashing (bcrypt)
- Refresh token rotation
- Session invalidation on logout

### Reliability

- 99.9% uptime target
- Automatic failover for critical services
- Data backup and recovery
- Graceful degradation under load

### Scalability

- Horizontal scaling for API servers
- Database indexing and query optimization
- Caching layer (Redis)
- CDN for static assets
- Microservice-ready architecture

### Maintainability

- Modular monolith architecture (initially)
- Feature-first folder structure
- Comprehensive documentation
- Code quality tools (ESLint, Prettier)
- TypeScript support (future)
- Automated testing

### Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast compliance
- Focus indicators
- ARIA labels

## 7. Future Scope

- Video Interview platform
- Voice Interview assessment
- Resume screening with AI
- ATS (Applicant Tracking System) score
- Hackathon platform with live contest
- AI Interviewer (automated interviews)
- Discussion forum for candidates
- Certification and badging system
- Company portal for hiring
- Campus hiring module
- Live coding interview with collaborative editor
- Proctored exam center integration
- White-label solution for enterprises
- Mobile application (React Native)

## 8. AI Features

- AI Question Generation from documents
- AI Quiz Generation on any topic
- AI-powered answer evaluation (subjective)
- AI Insights and recommendations
- AI Proctoring (computer vision)
- AI Cheat detection
- AI Performance predictions
- AI Content Moderation
- Pluggable AI provider system:
  - Google Gemini
  - OpenAI GPT-4
  - Anthropic Claude
  - DeepSeek
  - OpenRouter
  - Perplexity
  - Groq
  - Extensible for any provider

## 9. Coding Assessment

### Editor Features

- Syntax highlighting
- Auto-indentation
- Code completion (IntelliSense)
- Multiple tabs for multi-file problems
- Theme support (dark/light)
- Font size adjustment

### Execution

- Docker-based sandboxed execution
- Resource limits (CPU, memory, time)
- Standard input/output handling
- Compilation error messages
- Runtime error handling
- Test case results (passed/failed)
- Score calculation from test cases

### Problem Types

- Algorithms & Data Structures
- Database (SQL)
- Frontend (HTML/CSS/JS)
- System Design (subjective)

## 10. Quiz Assessment

### Configuration Parameters

- Title and description
- Time limit (per quiz or per question)
- Passing percentage
- Number of attempts allowed
- Shuffle questions (yes/no)
- Shuffle options (yes/no)
- Show result immediately or after review
- Show correct answers (yes/no)
- Negative marking
- Section-wise configuration
- Proctoring requirements

## 11. Admin Panel

### Dashboard Metrics

- Total users (active/inactive)
- Total assessments created
- Total assessments attempted
- Pass rate across all assessments
- Average score
- Question bank size
- AI usage statistics
- Recent registrations
- Recent attempts
- System health

### User Management

- User list with search/filter
- Create/edit/disable users
- Assign roles
- View user activity
- Impersonate user (audit logged)
- Export user data

### Question Bank Management

- View all questions with filters
- Bulk operations (delete, publish, archive)
- Import/export
- Version history
- Approval queue

## 12. AI Proctoring

### Real-time Monitoring

- Webcam feed analysis (every N seconds)
- Audio level monitoring
- Tab focus/blur events
- Window resize/move events
- Keyboard shortcuts detection
- Right-click disable

### Violation Types

| Violation | Severity |
|-----------|----------|
| Tab Switch | Medium |
| Multiple Faces | High |
| No Face Detected | High |
| Phone Detected | High |
| Looking Away | Low |
| Background Noise | Medium |
| Copy/Paste Attempt | High |
| Keyboard Shortcut (PrintScreen, etc.) | High |
| Network Disconnect | Medium |
| Fullscreen Exit | High |

### Actions on Violation

- Log violation with timestamp and screenshot
- Show warning to candidate
- Increment violation counter
- Auto-submit assessment on threshold breach
- Notify proctor (future)
- Generate violation report

## 13. Analytics

### Candidate Analytics

- Score trend over time
- Strength/weakness analysis
- Topic-wise performance
- Time management analysis
- Comparison with peers
- Improvement suggestions (AI)

### Question Analytics

- Difficulty index
- Discrimination index
- Time spent per question
- Correct/incorrect ratio
- Common wrong answers

### Assessment Analytics

- Total attempts
- Pass rate
- Average score
- Score distribution
- Completion rate
- Average time taken
- Drop-off analysis

## 14. Reports

- Candidate report (PDF)
- Assessment report (PDF/CSV)
- Question analysis report
- Proctoring audit report
- Custom report builder (future)

## 15. Integrations

- Google OAuth, GitHub OAuth
- Cloudinary (image/file upload)
- AWS S3 (file storage)
- SendGrid / AWS SES (email)
- Stripe (subscriptions/billing) - future
- Slack / Discord (notifications) - future
- Zoom / Google Meet (interviews) - future

## 16. Security

HTTP Security Headers
- Helmet.js configuration
- Content Security Policy
- Strict Transport Security
- X-Frame-Options
- X-Content-Type-Options

## 17. Deployment

- Docker containers
- Docker Compose (local dev)
- CI/CD pipeline (GitHub Actions)
- Environment-based configuration
- Reverse proxy (Nginx)
- SSL/TLS
- Monitoring (Prometheus + Grafana) - future
- Logging (Winston + ELK) - future

## 18. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | TBD | Initial release |
