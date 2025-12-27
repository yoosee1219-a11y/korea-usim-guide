# Admin Dashboard Rules

Parent: [Root AGENTS.md](../../../../AGENTS.md)
Context: React admin UI, authentication, content management, shadcn/ui components

## Core Purpose
Provide secure admin interface for content automation, keyword management, and publishing control with JWT authentication.

## Golden Rules

### Immutable Constraints
- NEVER store admin credentials in code or localStorage (only JWT tokens)
- NEVER skip authentication check on protected pages
- NEVER expose admin features to public users
- NEVER use alert() for user feedback (use toast notifications)
- NEVER commit sensitive data or API keys in frontend code

### Do's
- Always check for adminToken in localStorage on page load
- Always redirect to /admin/login if token is missing
- Always include Authorization: Bearer <token> in admin API requests
- Always use useToast hook for user notifications (not alert)
- Always handle API errors gracefully with user-friendly messages
- Always clear localStorage and redirect on 401 Unauthorized
- Always use shadcn/ui components for consistent design
- Always show loading states during async operations
- Always validate form inputs before submission
- Always use TypeScript interfaces for type safety

### Don'ts
- Don't store passwords in state longer than necessary
- Don't expose admin routes in public navigation
- Don't trust client-side validation alone (always validate on server)
- Don't use console.log in production (use conditional debugging)
- Don't forget to handle edge cases (empty states, errors, loading)
- Don't create new components when shadcn/ui provides them
- Don't use inline styles (use Tailwind CSS classes)

## File Structure

```
client/src/pages/admin/
├── login.tsx                # Admin login page
├── content-automation.tsx   # Content generation dashboard
├── keyword-list.tsx         # Keyword management
├── plan-list.tsx           # Plan listings
├── plan-new.tsx            # Create new plan
├── plan-edit.tsx           # Edit existing plan
└── tips-grouped-list.tsx   # Tips grouped by original
```

## Authentication Flow

### Login Page
Location: client/src/pages/admin/login.tsx

```typescript
import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store JWT token
      localStorage.setItem("adminToken", data.token);

      toast({
        title: "Login successful",
        description: "Redirecting to admin panel",
      });

      // Redirect to dashboard
      setLocation("/admin/content-automation");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Check your password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        required
        autoFocus
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" /> : "Login"}
      </Button>
    </form>
  );
}
```

### Protected Page Pattern
Location: client/src/pages/admin/content-automation.tsx:51-59

```typescript
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export default function ContentAutomation() {
  const [, navigate] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');

    if (token) {
      setIsAuthenticated(true);
      fetchData(); // Load admin data
    } else {
      // Redirect to login
      navigate('/admin/login');
    }

    setLoading(false);
  }, []);

  // Show loading spinner until auth check completes
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div>
      {/* Admin dashboard content */}
    </div>
  );
}
```

### Authenticated API Requests
```typescript
const fetchData = async () => {
  const token = localStorage.getItem('adminToken');

  try {
    const response = await fetch('/api/admin/keywords', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    setKeywords(data.keywords);

  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to load data",
      variant: "destructive"
    });
  }
};
```

## UI Components (shadcn/ui)

### Component Imports
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
```

### Button Patterns
```typescript
// Primary action
<Button onClick={handleSubmit} disabled={isLoading}>
  {isLoading ? <Loader2 className="animate-spin" /> : "Generate Content"}
</Button>

// Secondary action
<Button variant="outline" onClick={handleCancel}>
  Cancel
</Button>

// Destructive action
<Button variant="destructive" onClick={handleDelete}>
  Delete
</Button>

// Icon button
<Button size="icon" variant="ghost" onClick={handleRefresh}>
  <RefreshCw className="h-4 w-4" />
</Button>
```

### Card Layout
```typescript
<Card>
  <CardHeader>
    <CardTitle>Content Automation</CardTitle>
    <CardDescription>Generate SEO-optimized content from keywords</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
</Card>
```

### Badge Status Indicators
```typescript
// Status badges
const statusBadge = (status: string) => {
  switch (status) {
    case 'published':
      return <Badge variant="default"><CheckCircle className="mr-1" />Published</Badge>;
    case 'generating':
      return <Badge variant="secondary"><Loader2 className="mr-1 animate-spin" />Generating</Badge>;
    case 'failed':
      return <Badge variant="destructive"><AlertCircle className="mr-1" />Failed</Badge>;
    case 'pending':
      return <Badge variant="outline"><Clock className="mr-1" />Pending</Badge>;
  }
};
```

### Toast Notifications
```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

// Success toast
toast({
  title: "Success",
  description: "Content generated successfully",
});

// Error toast
toast({
  title: "Error",
  description: "Failed to generate content",
  variant: "destructive",
});

// Warning toast
toast({
  title: "Warning",
  description: "This operation cannot be undone",
  variant: "default", // or custom styling
});
```

## Content Automation Dashboard

### Data Fetching Pattern
Location: client/src/pages/admin/content-automation.tsx:85-123

```typescript
interface Keyword {
  id: string;
  keyword: string;
  search_intent?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'generating' | 'published' | 'failed';
  error_message?: string;
}

interface AutomationStats {
  total_keywords: number;
  pending_count: number;
  published_count: number;
  failed_count: number;
  success_rate: number;
}

const [keywords, setKeywords] = useState<Keyword[]>([]);
const [stats, setStats] = useState<AutomationStats | null>(null);
const [loading, setLoading] = useState(true);

const fetchData = async () => {
  const token = localStorage.getItem('adminToken');

  const [keywordsRes, statsRes] = await Promise.all([
    fetch('/api/admin/keywords?status=pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    }),
    fetch('/api/admin/content-automation/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  ]);

  if (keywordsRes.ok) {
    const data = await keywordsRes.json();
    setKeywords(data.keywords);
  }

  if (statsRes.ok) {
    const data = await statsRes.json();
    setStats(data.stats);
  }

  setLoading(false);
};
```

### Content Generation Trigger
```typescript
const [generating, setGenerating] = useState<Set<string>>(new Set());

const handleGenerate = async (keywordId: string) => {
  const token = localStorage.getItem('adminToken');

  // Mark as generating (optimistic UI update)
  setGenerating(prev => new Set(prev).add(keywordId));

  try {
    const response = await fetch(`/api/admin/content-automation/generate/${keywordId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Generation failed');
    }

    const result = await response.json();

    toast({
      title: "Generation Started",
      description: `Generating content for "${result.keyword}"`,
    });

    // Poll for status updates
    pollGenerationStatus(keywordId);

  } catch (error) {
    setGenerating(prev => {
      const next = new Set(prev);
      next.delete(keywordId);
      return next;
    });

    toast({
      title: "Error",
      description: "Failed to start generation",
      variant: "destructive"
    });
  }
};
```

### Polling for Status Updates
```typescript
const pollGenerationStatus = async (keywordId: string, maxAttempts = 60) => {
  const token = localStorage.getItem('adminToken');
  let attempts = 0;

  const poll = setInterval(async () => {
    attempts++;

    try {
      const response = await fetch(`/api/admin/content-automation/status/${keywordId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        clearInterval(poll);
        return;
      }

      const data = await response.json();

      if (data.status === 'published') {
        clearInterval(poll);
        setGenerating(prev => {
          const next = new Set(prev);
          next.delete(keywordId);
          return next;
        });

        toast({
          title: "Success",
          description: `Content published: ${data.tipId}`,
        });

        // Refresh data
        fetchData();
      } else if (data.status === 'failed' || attempts >= maxAttempts) {
        clearInterval(poll);
        setGenerating(prev => {
          const next = new Set(prev);
          next.delete(keywordId);
          return next;
        });

        toast({
          title: "Generation Failed",
          description: data.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error) {
      clearInterval(poll);
    }
  }, 5000); // Poll every 5 seconds
};
```

## Form Handling

### Controlled Inputs
```typescript
const [formData, setFormData] = useState({
  keyword: '',
  searchIntent: 'informational',
  priority: 'medium' as 'high' | 'medium' | 'low'
});

const handleChange = (field: string, value: any) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
};

<Input
  value={formData.keyword}
  onChange={(e) => handleChange('keyword', e.target.value)}
  placeholder="Enter keyword"
/>
```

### Form Submission
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validation
  if (!formData.keyword.trim()) {
    toast({
      title: "Validation Error",
      description: "Keyword is required",
      variant: "destructive"
    });
    return;
  }

  setIsSubmitting(true);

  try {
    const token = localStorage.getItem('adminToken');

    const response = await fetch('/api/admin/keywords', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error('Failed to create keyword');
    }

    toast({
      title: "Success",
      description: "Keyword created successfully"
    });

    // Reset form
    setFormData({ keyword: '', searchIntent: 'informational', priority: 'medium' });

    // Refresh list
    fetchData();

  } catch (error) {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to create keyword",
      variant: "destructive"
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

## State Management Patterns

### Loading States
```typescript
const [loading, setLoading] = useState(true);

// During fetch
setLoading(true);
const data = await fetchData();
setLoading(false);

// Render
if (loading) {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="animate-spin h-8 w-8" />
    </div>
  );
}
```

### Empty States
```typescript
if (keywords.length === 0) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <p className="text-muted-foreground">No keywords found</p>
        <Button className="mt-4" onClick={() => navigate('/admin/keywords/new')}>
          Add Keyword
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Error States
```typescript
const [error, setError] = useState<string | null>(null);

try {
  // ... operation
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
}

if (error) {
  return (
    <div className="p-4 bg-destructive/10 rounded-lg">
      <AlertCircle className="inline mr-2" />
      <span>{error}</span>
    </div>
  );
}
```

## Routing (Wouter)

### Navigation
```typescript
import { Link, useLocation } from 'wouter';

// Declarative navigation
<Link href="/admin/content-automation">
  <Button>Go to Dashboard</Button>
</Link>

// Programmatic navigation
const [, navigate] = useLocation();
navigate('/admin/login');
```

### Route Parameters
```typescript
// In route definition (App.tsx)
<Route path="/admin/plan/edit/:id" component={PlanEdit} />

// In component
import { useRoute } from 'wouter';

const [match, params] = useRoute('/admin/plan/edit/:id');
const planId = params?.id; // Extract ID from URL
```

## TypeScript Interfaces

### Common Types
```typescript
// API Response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Keyword
interface Keyword {
  id: string;
  keyword: string;
  search_intent?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'generating' | 'published' | 'failed';
  cpc_krw?: number;
  related_keywords?: string[];
  error_message?: string;
  created_at: string;
}

// Generation Result
interface GenerationResult {
  status: string;
  message: string;
  keywordId?: string;
  tipId?: string;
  slug?: string;
  error?: string;
}

// Stats
interface AutomationStats {
  total_keywords: number;
  pending_count: number;
  published_count: number;
  failed_count: number;
  success_rate: number;
}
```

## Styling with Tailwind CSS

### Layout
```typescript
// Container
<div className="container mx-auto px-4 py-8">

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Flex
<div className="flex items-center justify-between">

// Responsive
<div className="w-full md:w-1/2 lg:w-1/3">
```

### Common Patterns
```typescript
// Card hover effect
<Card className="hover:shadow-lg transition-shadow cursor-pointer">

// Loading spinner center
<div className="flex items-center justify-center min-h-screen">
  <Loader2 className="animate-spin h-8 w-8" />
</div>

// Status badge colors
<Badge className="bg-green-100 text-green-800">Success</Badge>
<Badge className="bg-red-100 text-red-800">Error</Badge>
<Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
```

## Security Best Practices

### Token Expiration Handling
```typescript
const handleApiError = (response: Response) => {
  if (response.status === 401) {
    // Token expired
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
    toast({
      title: "Session Expired",
      description: "Please login again",
      variant: "destructive"
    });
    return true;
  }
  return false;
};
```

### Logout Function
```typescript
const handleLogout = () => {
  localStorage.removeItem('adminToken');
  navigate('/admin/login');

  toast({
    title: "Logged Out",
    description: "You have been logged out successfully"
  });
};
```

## Performance Optimization

### Debouncing Search
```typescript
import { useState, useEffect } from 'react';

const [searchTerm, setSearchTerm] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchTerm);
  }, 300);

  return () => clearTimeout(timer);
}, [searchTerm]);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

### Memoization
```typescript
import { useMemo } from 'react';

const filteredKeywords = useMemo(() => {
  return keywords.filter(k =>
    k.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [keywords, searchTerm]);
```

## Error Handling

### API Error Pattern
```typescript
try {
  const response = await fetch('/api/admin/endpoint', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // Check for auth error first
  if (response.status === 401) {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
    return;
  }

  // Check for other errors
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  const data = await response.json();
  // Success handling

} catch (error) {
  console.error('API Error:', error);

  toast({
    title: "Error",
    description: error instanceof Error ? error.message : "Unknown error",
    variant: "destructive"
  });
}
```

## Testing Checklist

### Manual Testing
- [ ] Login with correct password
- [ ] Login with wrong password (should fail)
- [ ] Access protected page without token (should redirect)
- [ ] Token expiration (manually delete or wait 24h)
- [ ] Content generation flow (start to finish)
- [ ] Error handling (network errors, API errors)
- [ ] Loading states display correctly
- [ ] Empty states display correctly
- [ ] Toast notifications appear and disappear
- [ ] Responsive design (mobile, tablet, desktop)

## Troubleshooting

### "Cannot read properties of undefined"
Cause: Accessing nested properties without checking existence
Solution: Use optional chaining: `keyword?.seo_meta?.slug`

### Toast not showing
Cause: useToast hook not properly configured or ToastProvider missing
Solution: Check App.tsx has <ToastProvider> wrapper

### 401 Unauthorized on all requests
Cause: Token expired or malformed Authorization header
Solution: Check token format is "Bearer <token>", verify token in localStorage

### State not updating
Cause: Mutating state directly instead of creating new objects
Solution: Use spread operator or functional setState

### Infinite re-render loop
Cause: useEffect dependency array missing or incorrect
Solution: Add all dependencies to dependency array or use useCallback

## Critical Paths

### Login Flow
```
User enters password → POST /api/admin/login →
Server validates → Returns JWT token →
Store in localStorage → Redirect to dashboard
```

### Content Generation Flow
```
User clicks "Generate" → POST /api/admin/content-automation/generate/:id →
Server starts async generation → Returns "started" →
Client polls status every 5s → Status changes to "published" →
Stop polling → Show success toast → Refresh data
```

### Authentication Check
```
Page loads → useEffect checks localStorage for adminToken →
If exists: fetchData() → If missing: redirect to /admin/login →
All API requests include Authorization header
```

## Version History
Last Updated: 2024-12-27
Framework: React 18 + TypeScript + Vite
UI Library: shadcn/ui (Radix UI + Tailwind CSS)
Routing: Wouter (lightweight React Router alternative)
Authentication: JWT stored in localStorage (24h expiration)
