# Database Operations Rules

Parent: [Root AGENTS.md](../../AGENTS.md)
Context: PostgreSQL database operations, connection pooling, migrations, query patterns

## Core Purpose
Manage PostgreSQL database connections and queries for Vercel serverless environment with Supabase Transaction Pooler.

## Golden Rules

### Immutable Constraints
- NEVER use Session Pooler in Vercel (port 5432) - causes connection limit errors
- ALWAYS use Transaction Pooler (port 6543) for production
- NEVER commit DATABASE_URL to git
- NEVER use raw SQL without parameterized queries (SQL injection risk)
- NEVER forget to close connections in scripts (use process.exit)
- NEVER use hard DELETE (use soft delete with deletedAt column where applicable)

### Do's
- Always use prepared statements with $1, $2 placeholders
- Always validate DATABASE_URL at startup
- Always use db.query() from server/storage/db.ts (not direct Pool/Client)
- Always close Client connections in finally blocks
- Always use RETURNING * for INSERT/UPDATE to get created/updated data
- Always add indexes for foreign keys and frequently queried columns
- Always use JSONB for structured metadata (not JSON type)
- Always create updated_at triggers for tables with timestamps
- Always handle database errors gracefully (don't expose internal errors to clients)
- Always use transactions for multi-step operations

### Don'ts
- Don't create new Pool instances (use singleton from db.ts)
- Don't use query builders or ORMs (use raw SQL for simplicity)
- Don't expose database errors to API responses (leak information)
- Don't use SELECT * in production code (specify columns)
- Don't forget SSL configuration for production connections
- Don't use string concatenation for SQL (use parameterized queries)
- Don't mix connection patterns (stick to executeQuery abstraction)

## Connection Architecture

### Transaction Pooler vs Session Pooler
```typescript
// DATABASE_URL format determines pooler type
const isTransactionPooler = process.env.DATABASE_URL.includes(':6543/');

if (isTransactionPooler) {
  // PRODUCTION - Use connection pool (supports more concurrent connections)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 30000,
  });
} else {
  // DEVELOPMENT - Create new connection per request (Session Pooler constraint)
  // No pool created, executeQuery creates Client per request
}
```

### Connection Pool Configuration
Location: server/storage/db.ts:20-28

```typescript
pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
  max: 5,                       // Vercel serverless limit
  idleTimeoutMillis: 10000,     // 10 seconds idle timeout
  connectionTimeoutMillis: 30000, // 30 seconds connection timeout
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});
```

### Query Execution Pattern
Location: server/storage/db.ts:39-62

```typescript
// Abstraction layer - handles both pooled and per-request connections
async function executeQuery<T>(queryFn: (client: Client | Pool) => Promise<T>): Promise<T> {
  if (pool) {
    // Transaction Pooler: use pool
    return await queryFn(pool);
  } else {
    // Session Pooler: create new connection per request
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
      connectionTimeoutMillis: 30000,
    });

    try {
      await client.connect();
      const result = await queryFn(client);
      return result;
    } finally {
      // CRITICAL: Always close to prevent connection leak
      await client.end().catch(() => {});
    }
  }
}
```

### Database Object Export
Location: server/storage/db.ts:79-85

```typescript
export const db = {
  query: async (text: string, params?: any[]) => {
    return await executeQuery(async (db) => {
      return await db.query(text, params);
    });
  }
};

// Usage in application code
const result = await db.query('SELECT * FROM tips WHERE id = $1', [tipId]);
```

## SQL Query Patterns

### Safe Parameterized Queries
```typescript
// CORRECT - Parameterized query (prevents SQL injection)
const tips = await db.query(
  'SELECT * FROM tips WHERE language = $1 AND is_published = $2',
  ['ko', true]
);

// WRONG - String concatenation (SQL injection vulnerability)
// const tips = await db.query(`SELECT * FROM tips WHERE language = '${lang}'`);
```

### INSERT with RETURNING
```typescript
const result = await db.query(`
  INSERT INTO tips (
    category_id, slug, title, content, language, is_published
  ) VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING *
`, [categoryId, slug, title, content, language, true]);

const newTip = result.rows[0];
console.log('Created tip:', newTip.id);
```

### UPDATE with Validation
```typescript
const result = await db.query(`
  UPDATE tips
  SET title = $1, content = $2, updated_at = NOW()
  WHERE id = $3 AND language = $4
  RETURNING *
`, [title, content, tipId, language]);

if (result.rows.length === 0) {
  throw new Error('Tip not found or language mismatch');
}
```

### Soft DELETE Pattern
```typescript
// Soft delete (preferred for audit trail)
await db.query(`
  UPDATE tips
  SET deleted_at = NOW(), is_published = false
  WHERE id = $1
`, [tipId]);

// Hard delete (only for cleanup tasks)
await db.query('DELETE FROM tips WHERE id = $1', [tipId]);
```

### JSONB Query Patterns
```typescript
// Insert with JSONB metadata
await db.query(`
  INSERT INTO tips (title, seo_meta)
  VALUES ($1, $2)
`, [title, JSON.stringify({ keywords: ['korea', 'sim'], h2_tags: [...] })]);

// Query JSONB field
const tips = await db.query(`
  SELECT * FROM tips
  WHERE seo_meta->>'slug' = $1
`, [slug]);

// JSONB contains check
const tips = await db.query(`
  SELECT * FROM tips
  WHERE seo_meta @> $1
`, [JSON.stringify({ keywords: ['korea'] })]);

// JSONB array contains
const tips = await db.query(`
  SELECT * FROM tips
  WHERE seo_meta->'keywords' ?| $1
`, [['korea', 'esim']]);
```

## Schema Conventions

### Primary Keys
```sql
-- UUID for all user-facing tables (tips, plans)
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- VARCHAR for enum-like reference tables (carriers, tip_categories)
id VARCHAR(50) PRIMARY KEY
```

### Timestamps
```sql
-- Standard timestamp columns
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
deleted_at TIMESTAMP  -- For soft delete

-- Auto-update trigger (see migrations/001_initial_schema.sql:74-87)
CREATE TRIGGER update_tips_updated_at BEFORE UPDATE ON tips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Foreign Keys
```sql
-- ON DELETE CASCADE for dependent data
carrier_id VARCHAR(50) REFERENCES carriers(id) ON DELETE CASCADE

-- ON DELETE SET NULL for optional references
original_tip_id UUID REFERENCES tips(id) ON DELETE SET NULL
```

### Indexes
```sql
-- Single column indexes
CREATE INDEX idx_tips_language ON tips(language);
CREATE INDEX idx_tips_published ON tips(is_published);

-- Composite indexes for common query patterns
CREATE INDEX idx_tips_lang_published ON tips(language, is_published, published_at DESC);

-- Unique indexes
CREATE UNIQUE INDEX idx_tips_slug_unique ON tips(slug);

-- JSONB indexes (GIN for containment queries)
CREATE INDEX idx_tips_seo_meta ON tips USING GIN (seo_meta);
```

## Migrations

### Running Migrations
Location: scripts/run-migration.ts

```bash
# Run migration file
npx tsx scripts/run-migration.ts migrations/001_initial_schema.sql

# With environment variable
DATABASE_URL="postgresql://..." npx tsx scripts/run-migration.ts migrations/002_add_keywords.sql
```

### Migration Script Pattern
```typescript
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { Client } from 'pg';

config(); // Load .env

async function runMigration(migrationFile: string) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const sql = readFileSync(migrationFile, 'utf-8');
    await client.query(sql);
    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end(); // CRITICAL: Close connection
  }
}
```

### Migration File Structure
```sql
-- migrations/XXX_description.sql

-- Add new table
CREATE TABLE IF NOT EXISTS content_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_keywords_status ON content_keywords(status);

-- Add column to existing table (safe)
ALTER TABLE tips ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'ko';

-- Create trigger
CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON content_keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Database Schema Reference

### tips table (multilingual content)
```sql
CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id VARCHAR(50) REFERENCES tip_categories(id),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  thumbnail_url TEXT,
  language VARCHAR(5) DEFAULT 'ko',      -- 'ko', 'en', 'vi', etc.
  original_tip_id UUID REFERENCES tips(id), -- NULL for Korean original
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  seo_meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_tips_language ON tips(language);
CREATE INDEX idx_tips_published ON tips(is_published, published_at DESC);
CREATE INDEX idx_tips_slug ON tips(slug);
CREATE UNIQUE INDEX idx_tips_slug_unique ON tips(slug);
```

### content_keywords table (automation)
```sql
CREATE TABLE content_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword VARCHAR(255) NOT NULL,
  search_intent VARCHAR(50),         -- 'informational', 'transactional', etc.
  cpc_krw INTEGER,                   -- Cost per click in KRW
  priority VARCHAR(20),              -- 'high', 'medium', 'low'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'generating', 'published', 'failed'
  tip_id UUID REFERENCES tips(id),   -- Generated tip
  seo_meta JSONB,
  error_message TEXT,
  related_keywords JSONB,
  generated_at TIMESTAMP,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_keywords_status ON content_keywords(status);
CREATE INDEX idx_keywords_priority ON content_keywords(priority);
```

### plans table (pricing plans)
```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id VARCHAR(50) REFERENCES carriers(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) CHECK (plan_type IN ('prepaid', 'esim', 'both')),
  name TEXT NOT NULL,
  description TEXT,
  data_amount_gb INTEGER,
  validity_days INTEGER NOT NULL,
  price_krw INTEGER NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_plans_carrier ON plans(carrier_id);
CREATE INDEX idx_plans_active ON plans(is_active);
CREATE INDEX idx_plans_price ON plans(price_krw);
```

## Error Handling

### Database Connection Errors
```typescript
try {
  const result = await db.query('SELECT * FROM tips WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Tip not found' });
  }
  return res.json({ success: true, data: result.rows[0] });
} catch (error) {
  console.error('Database error:', error); // Log internally
  return res.status(500).json({
    success: false,
    error: 'Database operation failed' // Generic message to client
  });
}
```

### Transaction Pattern
```typescript
const client = new Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  await client.query('BEGIN');

  // Step 1: Insert tip
  const tipResult = await client.query(
    'INSERT INTO tips (title, content) VALUES ($1, $2) RETURNING id',
    [title, content]
  );

  // Step 2: Update keyword
  await client.query(
    'UPDATE content_keywords SET tip_id = $1, status = $2 WHERE id = $3',
    [tipResult.rows[0].id, 'published', keywordId]
  );

  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
```

## Performance Optimization

### Query Optimization
```typescript
// BAD - N+1 query problem
for (const tip of tips) {
  const category = await db.query('SELECT * FROM tip_categories WHERE id = $1', [tip.category_id]);
}

// GOOD - Use JOIN
const result = await db.query(`
  SELECT t.*, c.name as category_name
  FROM tips t
  LEFT JOIN tip_categories c ON t.category_id = c.id
  WHERE t.language = $1
`, [language]);
```

### Pagination
```typescript
const result = await db.query(`
  SELECT * FROM tips
  WHERE language = $1 AND is_published = true
  ORDER BY published_at DESC
  LIMIT $2 OFFSET $3
`, [language, limit, offset]);
```

### Counting with Pagination
```typescript
// Use EXPLAIN ANALYZE to check if query uses index
const result = await db.query(`
  SELECT COUNT(*) OVER() AS total_count, *
  FROM tips
  WHERE language = $1 AND is_published = true
  ORDER BY published_at DESC
  LIMIT $2 OFFSET $3
`, [language, limit, offset]);

const totalCount = result.rows[0]?.total_count || 0;
```

## Environment Variables

Required:
```bash
DATABASE_URL=postgresql://user:pass@host:6543/database  # Transaction Pooler
```

Optional:
```bash
NODE_ENV=production  # Enables SSL for database connections
```

## Troubleshooting

### "too many connections for role"
Cause: Using Session Pooler (port 5432) in Vercel serverless
Solution: Switch to Transaction Pooler (port 6543) in DATABASE_URL

### "Connection terminated unexpectedly"
Cause: Connection not closed in script or long-running operation
Solution: Always use try/finally with client.end()

### "SSL connection required"
Cause: Production database requires SSL but ssl: false in config
Solution: Set ssl: { rejectUnauthorized: false } for production

### "Database not found"
Cause: DATABASE_URL not loaded from .env in script
Solution: Add import 'dotenv/config' at top of script file

### "Relation does not exist"
Cause: Migration not run or wrong database connection
Solution: Run npx tsx scripts/run-migration.ts migrations/001_initial_schema.sql

## Testing

### Connection Test
Location: server/storage/db.ts:65-76

```typescript
import { testConnection } from './server/storage/db.js';

const isConnected = await testConnection();
if (!isConnected) {
  throw new Error('Database connection failed');
}
```

### Manual Query Test
```bash
# Test query with environment variable
DATABASE_URL="postgresql://..." node -e "
import('dotenv/config').then(() =>
  import('./server/storage/db.js').then(async ({db}) => {
    const result = await db.query('SELECT NOW()');
    console.log(result.rows[0]);
    process.exit(0);
  })
)"
```

## Critical Paths

### Multilingual Content Query
```
LanguageContext → useTips(language) → server/routes/tips.ts →
db.query('SELECT * FROM tips WHERE language = $1', [language])
```

### Content Generation Flow
```
automation/workflows/content-automation.ts →
db.query('INSERT INTO tips ...') →
db.query('UPDATE content_keywords SET tip_id = ...') →
Transaction Pooler → Supabase PostgreSQL
```

## Version History
Last Updated: 2024-12-27
PostgreSQL Version: 15.x (Supabase)
Connection Method: Transaction Pooler (port 6543)
Max Connections: 5 (Vercel serverless limit)
