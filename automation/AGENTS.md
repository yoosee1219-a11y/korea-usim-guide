# Content Automation Rules

Parent: [Root AGENTS.md](../AGENTS.md)
Context: AI-powered content generation, translation, SEO optimization, image handling

## Core Purpose
Generate SEO-optimized multilingual blog content using Gemini AI with automatic translation, internal linking, and image integration.

## Golden Rules

### Immutable Constraints
- NEVER generate content shorter than 3000 characters (SEO requirement)
- NEVER skip translation validation - check for Korean characters in non-Korean content
- NEVER exceed API rate limits (500ms delay between Google Translate calls, 200ms minimum)
- NEVER use Gemini 1.5-flash (deprecated) - use gemini-2.5-flash only
- NEVER commit GEMINI_API_KEY or GOOGLE_TRANSLATE_API_KEY to git

### Do's
- Always validate generated content (title, excerpt, content, h2_tags, keywords)
- Always use retry logic with exponential backoff for API calls
- Always parse JSON with multiple fallback patterns (```json```, ```json, raw braces)
- Always update keyword status to 'generating' before starting, 'published' or 'failed' after completion
- Always insert internal links to related content (minimum 2-3 links per post)
- Always use slugify with strict mode for URL-friendly slugs
- Always check slug uniqueness before inserting to database
- Always store SEO metadata as JSON in seo_meta column
- Always maintain 1-2% keyword density in generated content
- Always include minimum 5 H2 tags and 5-8 FAQ questions
- Always use prepared statements for SQL queries

### Don'ts
- Don't use placeholder image services (via.placeholder.com, placehold.co)
- Don't generate content without search intent context
- Don't skip slug collision checks (causes database unique constraint errors)
- Don't use markdown syntax in generated HTML content (use pure HTML tags)
- Don't parse JSON without try-catch and fallback patterns
- Don't hardcode language lists (use LANGUAGES constant from workflow)
- Don't translate without rate limiting delays
- Don't ignore Gemini response validation errors

## File Structure

```
automation/
├── services/
│   ├── gemini-service.ts       # Gemini API content generation
│   ├── image-service.ts        # Replicate/Unsplash image handling
│   ├── internal-linker.ts      # Related content linking
│   └── seo-optimizer.ts        # SEO analysis and optimization
├── workflows/
│   └── content-automation.ts   # Main orchestration workflow (11 steps)
├── templates/                  # (unused - templates in prompts)
└── utils/                      # (unused)
```

## Gemini API Patterns

### Model Selection
```typescript
// CORRECT - Use latest stable model
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",  // Released June 2025
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  }
});

// WRONG - Don't use deprecated models
// model: "gemini-1.5-flash"  // Causes 404 errors
```

### JSON Response Parsing
Gemini responses may have malformed JSON. Use triple-fallback pattern:

```typescript
let jsonContent = '';

// Pattern 1: Normal ```json\n...\n```
let jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
if (jsonMatch) {
  jsonContent = jsonMatch[1];
} else {
  // Pattern 2: ```json\n... (missing closing backticks)
  jsonMatch = response.match(/```json\s*\n([\s\S]+)/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1].replace(/\n```\s*$/, '');
  } else {
    // Pattern 3: Raw JSON (find first { to last })
    const firstBrace = response.indexOf('{');
    const lastBrace = response.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonContent = response.substring(firstBrace, lastBrace + 1);
    } else {
      throw new Error("Invalid JSON response from Gemini");
    }
  }
}

const content = JSON.parse(jsonContent);
```

### Content Validation
Location: automation/services/gemini-service.ts:251

```typescript
function validateGeneratedContent(content: GeneratedContent): boolean {
  // Title required
  if (!content.title || content.title.length === 0) return false;

  // Minimum 3000 characters for SEO
  if (!content.content || content.content.length < 3000) return false;

  // Excerpt required
  if (!content.excerpt || content.excerpt.length === 0) return false;

  // Minimum 5 H2 tags for SEO structure
  if (!content.h2_tags || content.h2_tags.length < 5) return false;

  // Minimum 5 keywords
  if (!content.keywords || content.keywords.length < 5) return false;

  // External links recommended but not required
  const hasExternalLinks = content.content.includes('<a href=');
  if (!hasExternalLinks) console.warn('No external links found');

  return true;
}
```

## Translation Workflow

### Google Cloud Translation API
Location: automation/workflows/content-automation.ts:208

```typescript
import { v2 } from '@google-cloud/translate';

const translationClient = new v2.Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY || '',
});

// Translate with retry logic
async function translateWithRetry(text: string, targetLang: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const [translation] = await translationClient.translate(text, targetLang);
      await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
      return translation;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
}
```

### Language Code Mapping
```typescript
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'tl', name: 'Tagalog' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'ne', name: 'Nepali' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'id', name: 'Indonesian' },
  { code: 'my', name: 'Burmese' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', dbCode: 'zh' }, // Note: dbCode differs
  { code: 'ru', name: 'Russian' },
];
```

### Translation Quality Check
Korean characters should NEVER appear in non-Korean translations.

```bash
# Check for quality issues
npx tsx scripts/check-translation-quality.ts

# Auto-fix wrong translations
npx tsx scripts/fix-wrong-translations.ts
```

## Content Generation Workflow

Location: automation/workflows/content-automation.ts

### 11-Step Pipeline
```
[1] Fetch keyword data from content_keywords table
[2] Generate content with Gemini (3000+ chars, 5+ H2 tags)
[3] Validate content structure and quality
[4] Skip image generation (admin sets manually)
[5] Generate SEO slug with collision check
[6] Find related content for internal linking
[7] Insert 2-3 internal links into content
[8] Skip content image insertion (admin handles)
[9] Save Korean original to tips table
[10] Translate to 11 languages (Google Translate API)
[11] Update keyword status to 'published'
```

### Slug Generation Pattern
```typescript
import slugify from 'slugify';

const slug = slugify(generatedContent.slug_suggestion || keyword, {
  lower: true,
  strict: true  // Remove special characters
});

// Check uniqueness
const slugCheck = await db.query(
  'SELECT id FROM tips WHERE slug = $1 LIMIT 1',
  [slug]
);

let finalSlug = slug;
if (slugCheck.rows.length > 0) {
  finalSlug = `${slug}-${Date.now()}`; // Append timestamp
}
```

### Error Handling Pattern
```typescript
try {
  // Update status to 'generating'
  await db.query('UPDATE content_keywords SET status = $1 WHERE id = $2',
    ['generating', keywordId]);

  // ... content generation steps ...

  // Update status to 'published'
  await db.query('UPDATE content_keywords SET status = $1, tip_id = $2 WHERE id = $3',
    ['published', tipId, keywordId]);

} catch (error) {
  // Log error to database
  await db.query('UPDATE content_keywords SET status = $1, error_message = $2 WHERE id = $3',
    ['failed', error.message, keywordId]);

  return { success: false, error: error.message };
}
```

## Internal Linking

Location: automation/services/internal-linker.ts

### Finding Related Content
```typescript
async function findRelatedContent(keyword: string, relatedKeywords: string[]) {
  // Search in titles and keywords
  const query = `
    SELECT id, slug, title, language
    FROM tips
    WHERE language = 'ko'
      AND is_published = true
      AND (
        title ILIKE $1
        OR seo_meta::jsonb->'keywords' ?| $2
      )
    LIMIT 5
  `;

  return await db.query(query, [`%${keyword}%`, relatedKeywords]);
}
```

### Link Insertion Strategy
- Insert 2-3 links minimum per post
- Place links naturally within first 1000 characters
- Use anchor text that matches linked content title
- Add rel="noopener noreferrer" for security

## SEO Optimization

Location: automation/services/seo-optimizer.ts

### Required SEO Elements
```typescript
interface SEOMeta {
  h2_tags: string[];           // Minimum 5
  keywords: string[];          // 5-10 keywords
  slug: string;                // URL-friendly
  thumbnail_suggestion: string; // Image description (English)
}
```

### Content Requirements
- Title: 60 characters max, include target keyword
- Excerpt: 150 characters max, include call-to-action
- Content: 3000-5000 characters (optimal for Google)
- H2 tags: 5-8 sections
- H3 tags: 2-4 per H2 section
- FAQ: 5-8 questions (for Google featured snippets)
- Keyword density: 1-2%
- External links: Minimum 2 government/official sites
- Internal links: 2-3 related posts

### HTML Structure
```html
<!-- Introduction (300-500 chars) -->
<p>Problem statement and empathy...</p>

<!-- Background (200-300 chars) -->
<h2>Background Explanation</h2>
<p>Legal/institutional context...</p>

<!-- Main Content (2500-4000 chars) -->
<h2>Complete Process Overview</h2>
<ul>
  <li>Step 1: ...</li>
  <li>Step 2: ...</li>
</ul>

<h2>Step 1: [Step Name]</h2>
<h3>[Subtopic 1]</h3>
<p>Detailed explanation with <strong>keyword</strong>...</p>
<p>Include <a href="https://..." target="_blank" rel="noopener noreferrer">official links</a></p>

<!-- FAQ Section (required for snippets) -->
<h2>Frequently Asked Questions</h2>
<h3>Q1. [Question]</h3>
<p>Clear answer in 50-100 characters</p>

<!-- Conclusion (100-200 chars) -->
<h2>Summary</h2>
<p>Key takeaways and next steps...</p>
```

## Image Service

Location: automation/services/image-service.ts

### Image Sources (3-tier fallback)
1. Replicate API (Stable Diffusion XL) - DISABLED by default
2. Unsplash API (stock photos) - Primary
3. Placeholder URL - Fallback

### Current Strategy
```typescript
// Image generation DISABLED in workflow
// Admins manually set images via admin panel
// Default placeholder: Unsplash Seoul stock photo
const thumbnailUrl = 'https://images.unsplash.com/photo-1551410224-699683e15636?w=1024&h=1024&fit=crop';
```

## Environment Variables

Required in .env:
```bash
GEMINI_API_KEY=...                    # Google Gemini 2.5-flash API key
GOOGLE_TRANSLATE_API_KEY=...          # Google Cloud Translation API v2 key
UNSPLASH_ACCESS_KEY=...               # Unsplash API key
REPLICATE_API_TOKEN=...               # (Optional) Replicate for AI images
```

## Rate Limiting

### Google Translate API
- Delay: 200ms minimum between calls
- Retry: 3 attempts with exponential backoff (1s, 2s, 3s)
- Batch: Translate one language at a time (not parallel)

### Gemini API
- No delay needed (generous quota)
- Timeout: 30s per request
- Error handling: Log and mark keyword as 'failed'

## Database Schema

### content_keywords table
```sql
CREATE TABLE content_keywords (
  id UUID PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  search_intent VARCHAR(50),
  cpc_krw INTEGER,
  priority VARCHAR(20), -- 'high', 'medium', 'low'
  status VARCHAR(20),   -- 'pending', 'generating', 'published', 'failed'
  tip_id UUID,          -- FK to tips.id (after generation)
  seo_meta JSONB,
  error_message TEXT,
  generated_at TIMESTAMP,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### tips table (multilingual)
```sql
CREATE TABLE tips (
  id UUID PRIMARY KEY,
  category_id VARCHAR(50),
  slug VARCHAR(255) UNIQUE,
  title VARCHAR(100),
  content TEXT,
  excerpt VARCHAR(200),
  thumbnail_url TEXT,
  language VARCHAR(5),       -- 'ko', 'en', 'vi', ...
  is_published BOOLEAN,
  published_at TIMESTAMP,
  original_tip_id UUID,      -- NULL for Korean, FK for translations
  seo_meta JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Bulk Generation Script

Location: scripts/bulk-content-generation.ts

### Usage
```bash
# Generate 20 pending keywords
npx tsx scripts/bulk-content-generation.ts --count 20

# Only high priority keywords
npx tsx scripts/bulk-content-generation.ts --priority high

# Retry failed keywords
npx tsx scripts/bulk-content-generation.ts --status failed

# Custom delay (10 seconds between generations)
npx tsx scripts/bulk-content-generation.ts --count 50 --delay 10000
```

### Options
- `-n, --count <number>` - Number of content pieces to generate (default: 10)
- `-p, --priority <level>` - Filter by priority: high, medium, low
- `-s, --status <status>` - Filter by status: pending, failed (default: pending)
- `-d, --delay <ms>` - Delay between generations in ms (default: 5000)
- `--stop-on-error` - Stop on first error (default: continue)

## Troubleshooting

### "Invalid JSON response from Gemini"
Cause: Gemini returned malformed JSON or no JSON block
Solution: Triple-fallback pattern already implemented in gemini-service.ts:48-73

### "Model not found: gemini-1.5-flash"
Cause: Using deprecated model name
Solution: Update to "gemini-2.5-flash" (current stable version)

### "Korean characters in Vietnamese translation"
Cause: Translation API failed but didn't throw error
Solution: Run check-translation-quality.ts, then fix-wrong-translations.ts

### "Duplicate key value violates unique constraint (slug)"
Cause: Slug collision not detected
Solution: Slug uniqueness check at content-automation.ts:82-92

### "Content too short (got 1500 characters)"
Cause: Gemini generated content below 3000 char minimum
Solution: Increase maxOutputTokens or regenerate with stricter prompt

### "Rate limit exceeded (Google Translate)"
Cause: Too many API calls too quickly
Solution: Increase delay in bulk-content-generation.ts (use --delay 10000)

## Performance Optimization

### Database
- Use indexes on tips.slug, tips.language, tips.is_published
- Use JSONB operators for seo_meta queries
- Close database connections in scripts (process.exit)

### API Calls
- Batch translations by language (not by field)
- Use connection pooling for database (already configured)
- Cache related content queries (5-minute TTL)

### Content Generation
- Generate content during off-peak hours
- Use bulk-content-generation.ts with --delay 5000 minimum
- Monitor Gemini API quota in Google Cloud Console

## Testing

### Manual Test Single Keyword
```bash
# Create test keyword
INSERT INTO content_keywords (keyword, search_intent, cpc_krw, priority, status)
VALUES ('한국 비자 연장 방법', 'informational', 5000, 'high', 'pending');

# Run automation
npx tsx -e "import {autoGenerateContent} from './automation/workflows/content-automation.js'; autoGenerateContent('[keyword-id]')"
```

### Verify Translation Quality
```bash
npx tsx scripts/check-translation-quality.ts
# Expected: 0 issues found
```

### Check Sitemap After Generation
```bash
npx tsx scripts/generate-sitemap.ts
# Verify new URLs included
```

## Critical Paths

### Content Creation Flow
Admin panel → POST /api/admin/content-automation/generate → autoGenerateContent() → Gemini API → Google Translate → Database (12 tips)

### Translation Fix Flow
check-translation-quality.ts → find Korean chars in non-Korean tips → fix-wrong-translations.ts → re-translate with Google Translate → update database

## Version History
Last Updated: 2024-12-27
Gemini Model: gemini-2.5-flash (released June 2025)
Google Translate: v2 API with API key authentication
Total Languages: 12 (1 original + 11 translations)
