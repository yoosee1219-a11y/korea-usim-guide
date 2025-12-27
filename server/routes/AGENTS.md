# API Routes Rules

Parent: [Root AGENTS.md](../../AGENTS.md)
Context: Express.js REST API routes, middleware, authentication, request/response handling

## Core Purpose
Define HTTP API endpoints for public content access and admin operations with proper authentication and error handling.

## Golden Rules

### Immutable Constraints
- NEVER disable CORS for admin endpoints
- NEVER expose internal errors to API responses (use generic messages in production)
- NEVER skip authentication for admin routes
- NEVER use GET for operations that modify data (use POST/PUT/DELETE)
- NEVER return database connection errors to clients (security risk)

### Do's
- Always use POST for all API endpoints (including reads) - project convention
- Always validate request body and parameters before database queries
- Always use requireAdminAuth middleware for /api/admin/* routes
- Always return consistent response format: {success: true/false, data/error}
- Always log errors with console.error (not console.log)
- Always sanitize user input before using in queries
- Always handle async errors with try/catch
- Always use HTTP status codes correctly (200, 400, 401, 404, 500)
- Always provide error details in development, generic in production
- Always use db.query() from server/storage/db.ts

### Don'ts
- Don't return stack traces in production error responses
- Don't trust client-provided data without validation
- Don't use req.query for sensitive operations (use req.body)
- Don't forget to check authentication before processing admin requests
- Don't expose database schema details in error messages
- Don't use synchronous operations in routes (blocks event loop)
- Don't leave console.log debugging statements in production code

## Route Structure

```
server/routes/
├── admin/               # Admin-only routes (require authentication)
│   ├── blog.ts         # Blog management
│   ├── content-automation.ts  # Content generation
│   ├── keywords.ts     # Keyword management
│   ├── login.ts        # Admin login
│   ├── plans.ts        # Plan management
│   └── tips-grouped.ts # Tips grouping
├── auth.ts             # Authentication endpoints
├── carriers.ts         # Carrier data (public)
├── plans.ts            # Plan listings (public)
├── sitemap.ts          # Sitemap generation
├── tips.ts             # Tips content (public)
├── translate-text.ts   # Translation API
└── translate.ts        # Translation utilities
```

## Middleware

### Admin Authentication
Location: server/middleware/adminAuth.ts

```typescript
import { requireAdminAuth } from '../middleware/adminAuth.js';

// Apply to all routes in admin router
router.use(requireAdminAuth);

// Or apply to individual routes
router.post('/sensitive-action', requireAdminAuth, async (req, res) => {
  // Only admins can access this
});
```

### Authentication Flow
```typescript
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify JWT token
    const decoded = verifyToken(token);

    if (!decoded || !decoded.admin) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Add admin info to request object
    (req as any).admin = decoded;

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed'
    });
  }
}
```

### Optional Authentication
```typescript
export function optionalAdminAuth(req: Request, res: Response, next: NextFunction) {
  // Try to authenticate, but proceed even if no token
  // Used for endpoints that behave differently for admins vs public users
  next();
}
```

## Request/Response Patterns

### Standard Response Format
```typescript
// Success response
res.json({
  success: true,
  data: { ... }
});

// Error response
res.status(400).json({
  success: false,
  error: 'User-friendly error message'
});
```

### Error Handling Template
Location: server/routes/tips.ts:58-72

```typescript
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};

    // Validate input
    if (body.page !== undefined && isNaN(Number(body.page))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page number'
      });
    }

    // Process request
    const result = await getTips(filters);

    // Return success
    res.json({ success: true, data: result });

  } catch (error) {
    console.error("Error fetching tips:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log full error internally
    console.error("Error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body,
    });

    // Return sanitized error to client
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tips',
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined
    });
  }
});
```

### Input Validation
```typescript
router.post("/create", requireAdminAuth, async (req, res) => {
  const { title, content, language } = req.body;

  // Required fields
  if (!title || !content) {
    return res.status(400).json({
      success: false,
      error: 'Title and content are required'
    });
  }

  // Type validation
  if (typeof title !== 'string' || title.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Title must be a string (max 100 characters)'
    });
  }

  // Enum validation
  const validLanguages = ['ko', 'en', 'vi', 'th', 'tl', 'uz', 'ne', 'mn', 'id', 'my', 'zh', 'ru'];
  if (language && !validLanguages.includes(language)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid language code'
    });
  }

  // Proceed with database operation
  // ...
});
```

## Public Routes

### GET /api/tips (Public)
Location: server/routes/tips.ts:37-73

```typescript
// POST /api/tips - List tips with pagination
router.post("/", async (req, res) => {
  const body = req.body || {};
  const filters: TipFilters = {};

  // Build filters from request body
  if (body.category_id) filters.category_id = body.category_id;
  if (body.page !== undefined) filters.page = Number(body.page);
  if (body.limit !== undefined) filters.limit = Number(body.limit);
  if (body.is_published !== undefined) filters.is_published = Boolean(body.is_published);
  if (body.language) filters.language = body.language;

  console.log('[DEBUG] /api/tips - Request:', { body, filters });

  const result = await getTips(filters);

  console.log('[DEBUG] /api/tips - Result:', {
    count: result.tips.length,
    languages: [...new Set(result.tips.map(t => t.language))]
  });

  res.json(result);
});
```

### POST /api/tips/slug/:slug (Public)
Location: server/routes/tips.ts:76-110

```typescript
// POST /api/tips/slug/:slug - Get tip by slug
router.post("/slug/:slug", async (req, res) => {
  const { slug } = req.params;
  const body = req.body || {};
  const language = body.language || 'ko';

  const tip = await getTipBySlug(slug, language);

  if (!tip) {
    return res.status(404).json({
      success: false,
      error: 'Tip not found'
    });
  }

  // Increment view count (async, don't wait)
  incrementTipViewCount(tip.id).catch(err =>
    console.error('Failed to increment view count:', err)
  );

  res.json({ success: true, data: tip });
});
```

## Admin Routes

### POST /api/admin/content-automation/generate/:keywordId
Location: server/routes/admin/content-automation.ts:13-67

```typescript
router.use(requireAdminAuth); // All admin routes require auth

router.post("/generate/:keywordId", async (req, res) => {
  const { keywordId } = req.params;

  // Check keyword exists
  const keywordCheck = await db.query(
    'SELECT * FROM content_keywords WHERE id = $1',
    [keywordId]
  );

  if (keywordCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Keyword not found' });
  }

  const keyword = keywordCheck.rows[0];

  // Check status (prevent duplicate generation)
  if (keyword.status === 'generating') {
    return res.status(409).json({
      error: 'Already generating',
      message: '이미 생성 중인 키워드입니다.'
    });
  }

  if (keyword.status === 'published') {
    return res.status(409).json({
      error: 'Already published',
      message: '이미 발행된 콘텐츠입니다.',
      tipId: keyword.tip_id
    });
  }

  // Start async generation (return immediately)
  autoGenerateContent(keywordId)
    .then(result => {
      if (result.success) {
        console.log('Content generated successfully:', result);
      } else {
        console.error('Content generation failed:', result.error);
      }
    })
    .catch(err => console.error('Unexpected error:', err));

  // Return immediately (don't wait for completion)
  res.json({
    status: 'started',
    message: 'Content generation started in background',
    keywordId,
    keyword: keyword.keyword
  });
});
```

### POST /api/admin/login
Location: server/routes/admin/login.ts

```typescript
router.post("/login", async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      error: 'Password required'
    });
  }

  const token = await authenticateAdmin(password);

  if (!token) {
    return res.status(401).json({
      error: 'Invalid password'
    });
  }

  res.json({
    success: true,
    token,
    message: 'Login successful'
  });
});
```

## Database Query Patterns

### Using Filters
```typescript
const filters: TipFilters = {};

// Build WHERE clause dynamically
let query = 'SELECT * FROM tips WHERE is_published = true';
const params: any[] = [];

if (filters.language) {
  params.push(filters.language);
  query += ` AND language = $${params.length}`;
}

if (filters.category_id) {
  params.push(filters.category_id);
  query += ` AND category_id = $${params.length}`;
}

// Pagination
const page = filters.page || 1;
const limit = filters.limit || 10;
const offset = (page - 1) * limit;

params.push(limit, offset);
query += ` ORDER BY published_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

const result = await db.query(query, params);
```

### Returning Created Data
```typescript
const result = await db.query(`
  INSERT INTO tips (title, content, language)
  VALUES ($1, $2, $3)
  RETURNING *
`, [title, content, language]);

const newTip = result.rows[0];

res.json({
  success: true,
  data: newTip
});
```

### Checking Existence
```typescript
const existing = await db.query(
  'SELECT id FROM tips WHERE slug = $1',
  [slug]
);

if (existing.rows.length > 0) {
  return res.status(409).json({
    success: false,
    error: 'Slug already exists'
  });
}
```

## Async Background Operations

### Fire and Forget Pattern
Location: server/routes/admin/content-automation.ts:46-54

```typescript
// Start long-running operation without blocking response
autoGenerateContent(keywordId)
  .then(result => {
    console.log('Background operation completed:', result);
  })
  .catch(err => {
    console.error('Background operation failed:', err);
  });

// Return immediately
res.json({
  status: 'started',
  message: 'Operation started in background'
});
```

### Polling Pattern
```typescript
// Client polls for status
router.post("/status/:keywordId", requireAdminAuth, async (req, res) => {
  const { keywordId } = req.params;

  const keyword = await db.query(
    'SELECT status, tip_id, error_message FROM content_keywords WHERE id = $1',
    [keywordId]
  );

  if (keyword.rows.length === 0) {
    return res.status(404).json({ error: 'Keyword not found' });
  }

  res.json({
    status: keyword.rows[0].status,
    tipId: keyword.rows[0].tip_id,
    error: keyword.rows[0].error_message
  });
});
```

## HTTP Status Codes

### Standard Usage
- 200 OK - Successful request
- 201 Created - Resource created successfully
- 400 Bad Request - Invalid input/validation error
- 401 Unauthorized - Authentication required or failed
- 403 Forbidden - Authenticated but not authorized
- 404 Not Found - Resource doesn't exist
- 409 Conflict - Resource already exists or conflicting state
- 500 Internal Server Error - Unexpected server error

### Examples
```typescript
// 200 - Success
res.json({ success: true, data: result });

// 201 - Created
res.status(201).json({ success: true, data: newResource });

// 400 - Bad Request
res.status(400).json({ success: false, error: 'Invalid input' });

// 401 - Unauthorized
res.status(401).json({ error: 'Authentication required' });

// 404 - Not Found
res.status(404).json({ success: false, error: 'Resource not found' });

// 409 - Conflict
res.status(409).json({ success: false, error: 'Already exists' });

// 500 - Server Error
res.status(500).json({ success: false, error: 'Internal server error' });
```

## CORS Configuration

### Settings
Location: server/app.ts

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://koreausimguide.com']
    : ['http://localhost:5173', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Admin Routes
NEVER disable CORS for admin endpoints. Always require proper authentication via JWT tokens.

## Logging

### Request Logging
```typescript
router.post("/", async (req, res) => {
  console.log('[DEBUG] Request received:', {
    path: req.path,
    body: req.body,
    query: req.query,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer ***' : undefined
    }
  });

  // Process request
  // ...
});
```

### Error Logging
```typescript
catch (error) {
  console.error("Error in route:", error);

  console.error("Error details:", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    requestBody: req.body,
    requestParams: req.params,
  });

  // Return generic error to client
  res.status(500).json({
    success: false,
    error: 'Operation failed',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

## Environment-Specific Behavior

### Development vs Production
```typescript
// Show detailed errors in development only
res.status(500).json({
  success: false,
  error: 'Database operation failed',
  details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
});

// Use different CORS origins
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://koreausimguide.com']
  : ['http://localhost:5173'];
```

## Security Best Practices

### Authentication
- Use JWT tokens with expiration (24 hours)
- Store tokens in localStorage (not cookies for this app)
- Require Bearer token in Authorization header
- Verify token signature and expiration

### Input Sanitization
```typescript
// Trim whitespace
const title = req.body.title?.trim();

// Validate length
if (title.length > 100) {
  return res.status(400).json({ error: 'Title too long' });
}

// Validate format (email, URL, etc.)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: 'Invalid email format' });
}
```

### SQL Injection Prevention
```typescript
// ALWAYS use parameterized queries
const result = await db.query(
  'SELECT * FROM tips WHERE slug = $1',
  [slug]  // Never interpolate: WHERE slug = '${slug}'
);
```

## Testing Routes

### Manual Testing with curl
```bash
# Public endpoint
curl -X POST http://localhost:5000/api/tips \
  -H "Content-Type: application/json" \
  -d '{"language": "en", "page": 1, "limit": 10}'

# Admin endpoint
curl -X POST http://localhost:5000/api/admin/content-automation/generate/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Manual Testing with Postman/Insomnia
1. Set method to POST
2. Set URL: http://localhost:5000/api/tips
3. Set Headers: Content-Type: application/json
4. Set Body (raw JSON): {"language": "en"}
5. For admin routes, add: Authorization: Bearer YOUR_TOKEN

## Troubleshooting

### "Unauthorized" on admin routes
Cause: Missing or invalid JWT token
Solution: Include Authorization: Bearer <token> header, check token expiration

### "CORS policy blocked"
Cause: Origin not in allowed list
Solution: Update CORS config in server/app.ts to include your origin

### "Cannot POST /api/endpoint"
Cause: Route not registered or wrong HTTP method
Solution: Check route registration in server/routes.ts, verify method is POST

### "Database connection failed"
Cause: DATABASE_URL not set or connection pool exhausted
Solution: Check environment variables, ensure Transaction Pooler (port 6543)

### "Request timeout"
Cause: Long-running operation blocking response
Solution: Use async background pattern, return immediately and poll for status

## Critical Paths

### Public Content Access
```
Client → GET /api/tips (with language filter) →
server/routes/tips.ts → getTips(filters) →
server/services/tipService.ts → db.query →
PostgreSQL → Return results
```

### Admin Content Generation
```
Admin Panel → POST /api/admin/content-automation/generate/:id →
requireAdminAuth middleware → Verify JWT →
autoGenerateContent (async) → Return "started" →
Background: Gemini API → Google Translate → Database
```

### Authentication Flow
```
Login Form → POST /api/admin/login (password) →
authenticateAdmin → Argon2 verify →
generateToken (JWT) → Return token →
Client stores in localStorage →
Future requests include in Authorization header
```

## Version History
Last Updated: 2024-12-27
Framework: Express.js 4.x
Authentication: JWT (jsonwebtoken)
Password Hashing: Argon2
All Endpoints: POST method (project convention)
