# Utility Scripts Rules

Parent: [Root AGENTS.md](../AGENTS.md)
Context: One-off scripts for database migrations, content fixes, bulk operations, quality checks

## Core Purpose
Provide CLI tools for database maintenance, content generation, translation fixes, and quality assurance outside the main application runtime.

## Golden Rules

### Immutable Constraints
- NEVER run scripts without import 'dotenv/config' at the top
- ALWAYS call process.exit(0) or process.exit(1) at the end of scripts
- NEVER commit scripts with hardcoded credentials or API keys
- ALWAYS close database connections before process.exit
- NEVER run destructive operations (DELETE, DROP) without confirmation prompts

### Do's
- Always import dotenv/config as first line for environment variables
- Always use try/catch with process.exit in finally block
- Always provide clear console output with progress indicators
- Always validate required environment variables before execution
- Always use db.query() from server/storage/db.ts (same as app code)
- Always log errors before throwing or exiting
- Always provide usage instructions when arguments are missing
- Always use npx tsx for TypeScript execution (not node)
- Always add --help flag for complex scripts
- Always close database connections (especially Client instances)

### Don'ts
- Don't use console.log for errors (use console.error)
- Don't run multiple scripts in parallel without coordination
- Don't modify production data without backup plan
- Don't use relative imports without proper TypeScript config
- Don't forget to update AGENTS.md when adding new scripts
- Don't skip validation of script arguments
- Don't use setTimeout/setInterval without clearing them

## Script Categories

### Content Automation
- bulk-content-generation.ts - Mass content generation from keywords
- add-missing-translations.ts - Add translations for specific languages
- fix-wrong-translations.ts - Re-translate incorrect translations
- translate-plans.ts - Translate pricing plans to all languages

### Quality Assurance
- check-translation-quality.ts - Detect Korean in non-Korean translations
- check-translations.ts - Verify translation completeness
- check-languages.ts - Language distribution analysis
- check-vietnamese.ts - Vietnamese-specific quality check

### Database Operations
- run-migration.ts - Execute SQL migration files
- fix-broken-images.ts - Update broken thumbnail URLs
- unify-multilingual-images.ts - Sync images across language versions

### SEO & Deployment
- generate-sitemap.ts - Create sitemap.xml with hreflang tags
- test-gemini-models.ts - Diagnostic tool for Gemini API compatibility

## Common Patterns

### Script Template
```typescript
import 'dotenv/config';  // MUST be first line
import { db } from '../server/storage/db.js';

async function main() {
  try {
    console.log('Starting script...\n');

    // Validate environment
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found');
    }

    // Script logic here
    const result = await db.query('SELECT COUNT(*) FROM tips');
    console.log('Total tips:', result.rows[0].count);

    console.log('\nScript completed successfully');
  } catch (error) {
    console.error('\nScript failed:', error);
    process.exit(1);
  } finally {
    // Clean up connections if needed
    process.exit(0);
  }
}

main();
```

### CLI Arguments Parsing
Location: scripts/bulk-content-generation.ts:164-215

```typescript
const args = process.argv.slice(2);
const options: ScriptOptions = {
  count: 10,
  priority: undefined,
  delay: 5000,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--count' || arg === '-n') {
    options.count = parseInt(args[++i], 10);
  } else if (arg === '--priority' || arg === '-p') {
    options.priority = args[++i] as 'high' | 'medium' | 'low';
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Usage: npx tsx scripts/bulk-content-generation.ts [options]

Options:
  -n, --count <number>     Number of items to process
  -p, --priority <level>   Priority filter: high, medium, low
  --help                   Show this help message

Examples:
  npx tsx scripts/bulk-content-generation.ts --count 20
  npx tsx scripts/bulk-content-generation.ts -p high
    `);
    process.exit(0);
  }
}
```

### Progress Reporting
Location: scripts/bulk-content-generation.ts:70-107

```typescript
for (let i = 0; i < items.length; i++) {
  const item = items[i];
  const progress = `[${i + 1}/${items.length}]`;

  console.log(`${progress} Processing: "${item.name}"`);

  try {
    const result = await processItem(item);

    if (result.success) {
      successCount++;
      console.log(`✅ ${progress} Success!`);
    } else {
      failedCount++;
      console.log(`❌ ${progress} Failed: ${result.error}\n`);
    }

    // Delay between operations (API rate limiting)
    if (i < items.length - 1) {
      console.log(`⏳ Waiting ${delay / 1000}s...\n`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

  } catch (error) {
    failedCount++;
    console.error(`❌ ${progress} Error: ${error.message}\n`);
  }
}

// Final report
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Report');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total: ${items.length}`);
console.log(`Success: ${successCount}`);
console.log(`Failed: ${failedCount}`);
console.log(`Success Rate: ${((successCount / items.length) * 100).toFixed(1)}%`);
```

### Error Collection Pattern
Location: scripts/check-translation-quality.ts:28-62

```typescript
const issues: any[] = [];

for (const lang of LANGUAGES) {
  console.log(`\nChecking ${lang.toUpperCase()}...`);

  const tips = await db.query(
    'SELECT * FROM tips WHERE language = $1',
    [lang]
  );

  for (const tip of tips.rows) {
    const hasKorean = containsKorean(tip.title);

    if (hasKorean) {
      console.log(`  ❌ ${tip.title.substring(0, 60)}...`);

      issues.push({
        language: lang,
        tipId: tip.id,
        title: tip.title,
        slug: tip.slug
      });
    } else {
      console.log(`  ✅ ${tip.title.substring(0, 60)}...`);
    }
  }
}

// Report
if (issues.length === 0) {
  console.log('\n✅ No issues found!');
} else {
  console.log(`\n❌ Found ${issues.length} issues:`);

  // Group by language
  const byLanguage = issues.reduce((acc, issue) => {
    acc[issue.language] = (acc[issue.language] || 0) + 1;
    return acc;
  }, {});

  console.log('\nBy language:');
  Object.entries(byLanguage).forEach(([lang, count]) => {
    console.log(`  ${lang}: ${count} issues`);
  });
}
```

## Script Descriptions

### bulk-content-generation.ts
Purpose: Generate multiple blog posts from content_keywords table
Usage:
```bash
# Generate 20 pending keywords
npx tsx scripts/bulk-content-generation.ts --count 20

# Only high priority
npx tsx scripts/bulk-content-generation.ts --priority high

# Retry failed keywords
npx tsx scripts/bulk-content-generation.ts --status failed

# Custom delay
npx tsx scripts/bulk-content-generation.ts --count 50 --delay 10000
```

Options:
- -n, --count: Number of content pieces (default: 10)
- -p, --priority: Filter by priority (high, medium, low)
- -s, --status: Filter by status (pending, failed)
- -d, --delay: Delay between generations in ms (default: 5000)
- --stop-on-error: Stop on first error (default: continue)

Critical: Uses autoGenerateContent from automation/workflows/content-automation.ts

### check-translation-quality.ts
Purpose: Detect Korean characters in non-Korean translations
Usage:
```bash
npx tsx scripts/check-translation-quality.ts
```

Detection:
- Korean: /[가-힣]/
- Thai: /[\u0E00-\u0E7F]/
- Russian: /[\u0400-\u04FF]/
- Chinese: /[\u4E00-\u9FFF]/
- Burmese: /[\u1000-\u109F]/
- Nepali: /[\u0900-\u097F]/

Output: List of tips with wrong language characters, grouped by language

### fix-wrong-translations.ts
Purpose: Re-translate tips with incorrect translations
Usage:
```bash
npx tsx scripts/fix-wrong-translations.ts
```

Process:
1. Load hardcoded list of wrong tip IDs and original IDs
2. For each wrong tip, fetch Korean original from original_tip_id
3. Re-translate using Google Translate API with retry logic
4. Update database with correct translations
5. Add 500ms delay between translations (rate limiting)

Retry Logic:
```typescript
async function translateWithRetry(text: string, targetLang: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const [translation] = await translationClient.translate(text, targetLang);
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
      return translation;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
}
```

### generate-sitemap.ts
Purpose: Generate sitemap.xml for all pages in 12 languages
Usage:
```bash
npx tsx scripts/generate-sitemap.ts
```

Output: dist/public/sitemap.xml

Process:
1. Add homepage (12 languages, priority 1.0 for English, 0.9 for others)
2. Add /tips pages (12 languages, priority 0.8)
3. Add individual tip pages with hreflang alternates (priority 0.7)
4. Add /compare pages (12 languages, priority 0.8)
5. Add static pages (about, contact, privacy, terms)
6. Write XML with hreflang tags for multilingual SEO

XML Structure:
```xml
<url>
  <loc>https://koreausimguide.com/en/tips/korea-sim-card-guide</loc>
  <lastmod>2024-12-27</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
  <xhtml:link rel="alternate" hreflang="ko" href="https://koreausimguide.com/ko/tips/korea-sim-card-guide" />
  <xhtml:link rel="alternate" hreflang="en" href="https://koreausimguide.com/en/tips/korea-sim-card-guide" />
  <!-- ... 10 more languages ... -->
</url>
```

### run-migration.ts
Purpose: Execute SQL migration files on database
Usage:
```bash
npx tsx scripts/run-migration.ts migrations/001_initial_schema.sql
```

Process:
1. Load .env with dotenv
2. Create new Client (not Pool) for one-time operation
3. Read SQL file with readFileSync
4. Execute SQL with client.query
5. Log success or error
6. ALWAYS close client connection in finally block

Safety: Uses IF NOT EXISTS for tables/indexes to be idempotent

### test-gemini-models.ts
Purpose: Diagnostic tool to test Gemini API model compatibility
Usage:
```bash
npx tsx scripts/test-gemini-models.ts
```

Tests:
- gemini-1.5-flash (deprecated - expect 404)
- gemini-2.5-flash (current - expect success)
- gemini-pro (fallback)

Output: Success/failure for each model with error details

Critical: Used to debug "Model not found" errors in content generation

## Database Connection in Scripts

### Using db.query (Preferred)
Location: All scripts use server/storage/db.ts

```typescript
import 'dotenv/config';
import { db } from '../server/storage/db.js';

async function main() {
  // db.query handles connection management automatically
  const result = await db.query('SELECT * FROM tips LIMIT 1');
  console.log(result.rows[0]);

  // No need to manually close connection
  process.exit(0);
}
```

### Using Direct Client (For Transactions)
Location: scripts/run-migration.ts

```typescript
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  await client.query('BEGIN');
  await client.query('INSERT ...');
  await client.query('UPDATE ...');
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end(); // CRITICAL: Always close
}
```

## Environment Variables

Required for all scripts:
```bash
DATABASE_URL=postgresql://...  # Supabase Transaction Pooler
```

Script-specific:
```bash
# bulk-content-generation.ts, fix-wrong-translations.ts
GEMINI_API_KEY=...
GOOGLE_TRANSLATE_API_KEY=...
UNSPLASH_ACCESS_KEY=...

# generate-sitemap.ts
# (No additional vars needed)
```

## Rate Limiting

### Google Translate API
```typescript
// Delay between translation requests
await new Promise(resolve => setTimeout(resolve, 500)); // 500ms

// Between bulk operations
await new Promise(resolve => setTimeout(resolve, delay)); // Configurable
```

### Gemini API
```typescript
// No delay needed (generous quota)
// But use --delay in bulk operations to avoid overwhelming system
```

## Error Handling Patterns

### Graceful Degradation
```typescript
try {
  const result = await riskyOperation();
  console.log('✅ Success:', result);
} catch (error) {
  console.warn('⚠️ Failed but continuing:', error.message);
  // Continue with next item instead of exiting
}
```

### Fail Fast
```typescript
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment');
  process.exit(1);
}
```

### Collect Errors, Report Later
```typescript
const errors: Array<{item: string, error: string}> = [];

for (const item of items) {
  try {
    await processItem(item);
  } catch (error) {
    errors.push({ item: item.name, error: error.message });
  }
}

if (errors.length > 0) {
  console.log('\n❌ Errors occurred:');
  errors.forEach(e => console.log(`  - ${e.item}: ${e.error}`));
  process.exit(1);
}
```

## Console Output Best Practices

### Structure
```typescript
console.log('🚀 Starting script...\n');  // Opening

console.log('[1/4] Step 1...');          // Progress
console.log('✅ Step 1 complete\n');

console.log('[2/4] Step 2...');
console.log('⚠️ Warning: ...\n');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━');  // Final report
console.log('📊 Report');
console.log('━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total: ${total}`);
console.log(`Success: ${success}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━\n');
```

### Icons (No Emojis in Code, OK in Console)
- ✅ Success
- ❌ Error/Failed
- ⚠️ Warning
- 🚀 Starting
- 📊 Report/Statistics
- ⏳ Waiting/In Progress
- 💡 Tip/Suggestion
- 🔍 Searching/Checking

## Testing Scripts

### Dry Run Pattern
```typescript
const dryRun = args.includes('--dry-run');

if (dryRun) {
  console.log('[DRY RUN] Would update:', item.id);
} else {
  await db.query('UPDATE tips SET ... WHERE id = $1', [item.id]);
}
```

### Manual Testing
```bash
# Test with single item
npx tsx scripts/bulk-content-generation.ts --count 1

# Test with dry run
npx tsx scripts/fix-wrong-translations.ts --dry-run

# Test with verbose output
DEBUG=true npx tsx scripts/check-translation-quality.ts
```

## Troubleshooting

### "dotenv not found"
Cause: Missing import 'dotenv/config'
Solution: Add as first line of script

### "Cannot find module '../server/storage/db.js'"
Cause: Incorrect relative path or TypeScript module resolution
Solution: Check tsconfig.json moduleResolution and path

### "Script hangs after completion"
Cause: Database connection not closed or setTimeout not cleared
Solution: Ensure process.exit(0) in finally block

### "ECONNREFUSED" in scripts
Cause: Using Session Pooler or wrong DATABASE_URL
Solution: Verify DATABASE_URL includes :6543 (Transaction Pooler)

### "Too many API requests"
Cause: No delay between API calls
Solution: Add await new Promise(resolve => setTimeout(resolve, 500))

## Maintenance

### Adding New Script
1. Create scripts/new-script.ts
2. Add import 'dotenv/config' as first line
3. Add try/catch with process.exit
4. Add --help flag
5. Update scripts/AGENTS.md (this file) with description
6. Test with sample data before production run

### Deprecating Script
1. Move to scripts/deprecated/ folder
2. Update AGENTS.md to mark as deprecated
3. Add deprecation notice in script file
4. Remove from common workflows documentation

## Critical Paths

### Content Quality Workflow
```
check-translation-quality.ts → identify issues →
fix-wrong-translations.ts → re-translate →
check-translation-quality.ts → verify fix
```

### Bulk Content Generation
```
Admin panel: seed keywords to content_keywords →
bulk-content-generation.ts → autoGenerateContent →
generate-sitemap.ts → sitemap.xml →
Submit to Google Search Console
```

### Database Migration
```
Write migrations/XXX_description.sql →
npx tsx scripts/run-migration.ts migrations/XXX_description.sql →
Verify in database
```

## Version History
Last Updated: 2024-12-27
Total Scripts: 13
TypeScript Executor: npx tsx
Database Connection: server/storage/db.ts (Transaction Pooler)
