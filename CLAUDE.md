# ContractIQ

An enterprise AI platform for legal contract review, targeting NDA and MSA documents.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Radix UI
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **AI:** Anthropic Claude API
- **Testing:** Vitest, Testing Library

## Project Structure

```
contractiq/        # Next.js app
├── src/
├── supabase/
├── tests/
└── evals/
docs/              # Engineering docs, specs, design system
skills/            # Claude Code custom skills (slash commands)
```

## Commands

All commands run from `contractiq/`:

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run test         # Run tests
npm run lint         # Lint
```

## Skills

| Command | Purpose |
|---|---|
| `/engineering-planner` | PRD → engineering docs |
| `/implementation-specs` | Engineering docs → specs + SQL |
| `/frontend-setup` | Scaffold Next.js project |
| `/design-system` | Enforce brand design system |
| `/security-foundation` | Implement security controls |