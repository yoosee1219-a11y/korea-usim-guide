# Project Context & Operations

## Business Goal
Korea USIM Guide - 외국인을 위한 한국 유심/eSIM 가이드 및 요금제 비교 플랫폼. 12개 언어 지원, AI 기반 콘텐츠 자동 생성, SEO 최적화.

## Tech Stack
- Frontend: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- Backend: Express.js + TypeScript
- Database: PostgreSQL (Supabase)
- Deployment: Vercel
- AI: Google Gemini 2.5-flash, Google Translate API
- Image: Replicate (Stable Diffusion XL), Unsplash API

## Operational Commands
```bash
npm run dev          # Start development server (port 5000)
npm run build        # Build for production
npm test             # Run tests
npx tsx scripts/[script-name].ts  # Run utility scripts
```

## Database Commands
```bash
npx tsx scripts/run-migration.ts [migration-file]  # Run migration
DATABASE_URL="..." npx tsx scripts/[db-script].ts  # Run with env
```

# Golden Rules

## Immutable Constraints
- NEVER commit sensitive data (API keys, DATABASE_URL, service account JSON)
- NEVER use filesystem writes in Vercel serverless functions (use database)
- NEVER skip translation for published content (all 12 languages required)
- NEVER disable CORS for admin endpoints

## Do's
- Always use TypeScript strict mode
- Always validate environment variables at startup
- Always use prepared statements for SQL queries (prevent injection)
- Always add hreflang tags for multilingual pages
- Always update sitemap after content changes
- Always use dotenv for local development
- Always test translations before publishing

## Don'ts
- Don't use placeholder image services (via.placeholder.com, placehold.co - unreliable)
- Don't create new files without reading existing code first
- Don't use emojis in production code or commit messages (context waste)
- Don't mix database connection patterns (use db.query() consistently)
- Don't hardcode URLs (use environment variables)
- Don't skip error handling in async functions
- Don't use alert() (use toast notifications)

# Standards & References

## Code Conventions
- File naming: kebab-case for files, PascalCase for components
- Import order: external → internal → types → styles
- Max line length: 100 characters
- Async/await over promises chains
- Functional components only (no class components)

## Git Strategy
- Branch: main (production auto-deploy via Vercel)
- Commit format: Imperative mood, no emojis in first line
- Footer: Include "Generated with Claude Code" + Co-Authored-By

## Database Schema
- All tables use UUID primary keys
- Timestamps: created_at, updated_at (auto-managed)
- Soft delete: use deletedAt column, not hard delete
- Multilingual: original_tip_id links to Korean original

## API Response Format
```typescript
// Success
{ success: true, data: {...} }
// Error
{ success: false, error: "message" }
```

## Maintenance Policy
When rules and code diverge, update this file immediately. This document is living documentation.

# Context Map (Action-Based Routing)

- **[Content Automation (AI)](./automation/AGENTS.md)** — Gemini content generation, translation, SEO optimization
- **[Database Operations](./server/storage/AGENTS.md)** — PostgreSQL queries, migrations, connection pooling
- **[Admin Dashboard (FE)](./client/src/pages/admin/AGENTS.md)** — Admin UI, authentication, content management
- **[Public Pages (FE)](./client/src/pages/AGENTS.md)** — Tips, Compare, Home pages, multilingual routing
- **[API Routes (BE)](./server/routes/AGENTS.md)** — Express routes, middleware, authentication
- **[SEO & Analytics](./client/src/components/seo/AGENTS.md)** — Meta tags, structured data, sitemap
- **[Utility Scripts](./scripts/AGENTS.md)** — Migrations, data fixes, bulk operations

# Environment Variables

## Required (Production)
```
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
GOOGLE_TRANSLATE_API_KEY=...
UNSPLASH_ACCESS_KEY=...
NODE_ENV=production
```

## Optional
```
REPLICATE_API_TOKEN=...  # AI image generation (disabled by default)
CRON_SECRET=...          # Automated tasks
ADMIN_SETUP_SECRET=...   # One-time admin setup (remove after use)
```

# Quick Reference

## Add New Language
1. Update client/src/contexts/LanguageContext.tsx (SUPPORTED_LANGUAGES)
2. Update automation/workflows/content-automation.ts (LANGUAGES array)
3. Update scripts/generate-sitemap.ts (LANGUAGES array)
4. Run translation script for existing content

## Add New Tip
1. Use admin panel: /admin/content-automation
2. Or manual: INSERT into tips (12 languages via automation)
3. Regenerate sitemap: npx tsx scripts/generate-sitemap.ts
4. Submit to Google Search Console

## Fix Broken Translations
```bash
npx tsx scripts/check-translation-quality.ts  # Find issues
npx tsx scripts/fix-wrong-translations.ts     # Auto-fix
```

## Bulk Content Generation
```bash
npx tsx scripts/bulk-content-generation.ts --count 50 --priority high
```

# Critical Paths

## Authentication Flow
client/src/hooks/useAuth.ts → server/middleware/auth.ts → JWT verification

## Content Creation Flow
admin panel → server/routes/admin/content-automation.ts → automation/workflows/content-automation.ts → Gemini API → Google Translate → Database (12 records)

## Multilingual Routing
LanguageContext → useTips(language) → server/routes/tips.ts → tipService.getTips(filters.language) → PostgreSQL WHERE language = $1

# Performance Optimization

## Database
- Use transaction pooler (port 6543) not session pooler
- Connection limit: 5 (Vercel serverless constraint)
- Query timeout: 30s
- Always close connections in scripts (process.exit)

## API
- Rate limiting: Google Translate 500ms delay between requests
- Retry logic: 3 attempts with exponential backoff
- Cache: React Query 5min stale time for tips

## SEO
- Sitemap: Auto-generated, 12 languages × all pages
- hreflang: Auto-added for all multilingual pages
- Robots.txt: Allow all except /admin/
- Priority: Homepage (1.0) > Tips list (0.8) > Individual tips (0.7)

# Troubleshooting

## "DATABASE_URL not found"
Add `import 'dotenv/config'` at top of script

## "Language filtering not working"
Check: LanguageContext includes all 12 languages, tipService uses language filter, API receives language in request body

## "Vercel 500 error on settings save"
Use database (app_settings table) not filesystem

## "Translation contains Korean text"
Run check-translation-quality.ts, then fix-wrong-translations.ts

## "Sitemap not updating"
Regenerate after content changes, resubmit to Search Console

# Version Info
Last Updated: 2024-12-27
Claude Code Agent System: Active
Total Languages: 12 (ko, en, vi, th, tl, uz, ne, mn, id, my, zh, ru)
