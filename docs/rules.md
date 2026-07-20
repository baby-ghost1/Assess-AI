# Coding Rules

These rules must be followed by any AI agent working on this project.

## General

- Never use inline CSS — always use Tailwind utility classes
- Never duplicate components — reuse existing ones; if a component doesn't exist, create it in the appropriate shared location
- Never duplicate APIs — check existing endpoints before creating new ones
- Never duplicate validation — reuse Zod schemas across client and server via the `shared/` package
- Every API endpoint must have input validation (Zod)
- Every API endpoint must be documented
- Every component must be reusable
- Never hardcode URLs — use environment variables or config files
- Never hardcode secrets — always use environment variables
- Use JSDoc comments for function documentation
- No placeholder implementations — every feature must be complete before commit

## Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Functions/Variables**: camelCase (`getUserById`)
- **Files**: kebab-case for non-component files (`use-auth.js`, `auth-service.js`)
- **Folders**: lowercase, feature-based (`features/auth/`, `features/quiz/`)
- **API Routes**: kebab-case (`/api/v1/question-bank`)
- **Database Collections**: plural snake_case (`question_banks`)
- **CSS Classes**: Tailwind utility classes only — no custom CSS classes unless absolutely necessary

## Architecture Rules

- Follow feature-first folder structure — every feature is self-contained
- Maintain the modular monolith approach — bounded contexts with clear interfaces
- Controller → Service → Repository — strict layered architecture
- Services should never import directly from other module's services — use shared interfaces or event bus
- Every module should have: routes, controller, service, repository, model, validation, types

## Code Quality

- Follow SOLID principles
- Prefer composition over inheritance
- Keep functions small and single-purpose
- Maximum one level of callback nesting (use async/await)
- No console.log in production — use the Winston logger
- Handle all promise rejections
- Use early returns to avoid deep nesting
- Prefer pure functions where possible

## Error Handling

- Use a centralized error handling middleware
- Define custom error classes in `shared/errors/`
- Never expose stack traces in production
- Always return consistent error response format
- Log errors with appropriate severity levels

## State Management

- Use Redux Toolkit for global app state (auth, theme, UI)
- Use TanStack Query for all server state (API data, caching)
- Use React Hook Form + Zod for form state and validation
- Avoid prop drilling — use composition or context
- Keep state as local as possible

## UI/UX

- Responsive design first — mobile, tablet, desktop
- Dark mode support is mandatory
- Loading skeletons are mandatory for all data-fetching components
- Error boundaries are mandatory for all feature sections
- Transition animations should be subtle (250ms, ease-out)
- Glassmorphism and soft shadows for cards
- Accessibility: proper ARIA labels, keyboard navigation, focus management
- All forms must show inline validation errors
- Toast notifications for success/error actions

## Components

- Each component should be in its own file
- Components should accept and spread `className` prop
- Use `forwardRef` for reusable form elements
- Export components as named exports
- Index files for barrel exports in feature directories

## Performance

- Lazy load routes with React.lazy + Suspense
- Memoize expensive computations (useMemo, useCallback)
- Virtualize long lists (react-window or TanStack Virtual)
- Debounce search inputs and real-time events
- Optimize images (next/image equivalent or lazy loading)
- Minimize bundle size — tree-shake imports

## Database

- Add indexes for all queried fields
- Use MongoDB aggregation pipeline for complex queries
- Avoid N+1 queries — use population or aggregation
- Keep document size reasonable — use references over embedding for large data
- Audit fields (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`) on every collection

## API

- All API responses must use the standard envelope format
- Version all APIs (`/api/v1/`)
- Use appropriate HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Use proper HTTP status codes
- Paginate all list endpoints
- Support sorting and filtering on list endpoints

## Security

- Validate and sanitize all user inputs
- Use parameterized queries (Mongoose does this by default)
- Implement rate limiting on auth endpoints
- Never expose internal IDs in URLs if they reveal business logic (use UUIDs or slugs)
- Always check authorization — not just authentication
- Sanitize file uploads (type, size, content check)
- Log all security-relevant events

## Git & Commits

- Atomic commits — one logical change per commit
- Conventional commit format: `type(scope): description`
  - `feat(auth): add Google OAuth`
  - `fix(quiz): correct timer overflow`
  - `docs(architecture): update API layer diagram`

## Documentation

- Never modify architecture without updating `docs/architecture.md`
- Update `docs/memory.md` after completing any phase or significant feature
- Keep `docs/project-requirements.md` in sync with implemented features
- Document any architecture decisions in `docs/memory.md` under "Known Decisions"

## Testing

- Unit tests for all services and utilities
- Integration tests for API endpoints
- Component tests for UI components
- Test error scenarios, not just happy paths
- Aim for >80% code coverage initially

## Exceptions

- These rules apply to all code written for this project
- If a rule conflicts with a specific requirement, escalate rather than break the rule
- Rules can be updated via pull request with justification
