# System Patterns

## Database Access Patterns

### Supabase Client Initialization
- Use `getClient()` from `src/lib/supabase.ts` to get the appropriate client instance
- Never import `supabaseAdmin` directly
- For admin operations, pass context: `getClient({ requiresAdmin: true })`
- For RLS bypass, pass context: `getClient({ bypassRLS: true })`
- Regular client operations use: `getClient()`

Example:
```typescript
// Good - proper admin client initialization
const supabase = getClient({ requiresAdmin: true });
await supabase.from('table').select();

// Bad - don't use direct admin import
import { supabaseAdmin } from '../lib/supabase';
await supabaseAdmin.from('table').select();
```

### RLS Handling Patterns
1. Try Regular Client First:
```typescript
// First attempt with regular client
const { data, error } = await supabase
  .from('table')
  .select('*');

if (error) {
  if (isRLSError(error)) {
    // Fall back to admin client
    const adminClient = getClient({ requiresAdmin: true });
    const { data: adminData } = await adminClient
      .from('table')
      .select('*');
    // Handle admin data...
  }
  // Handle other errors...
}
```

2. Direct Admin Access When Required:
```typescript
// When admin access is known to be needed
const adminClient = getClient({ requiresAdmin: true });
const { data, error } = await adminClient
  .from('table')
  .select('*');
```

3. Transaction-like Operations:
```typescript
// Initialize once for multiple operations
const supabase = getClient({ requiresAdmin: true });

// Use same client instance
const { data: first } = await supabase.from('table1').select();
const { data: second } = await supabase.from('table2').select();
```

### Client Context Options
- `requiresAdmin`: For operations requiring admin privileges
- `bypassRLS`: For operations needing to bypass Row Level Security
- No context: For regular client operations respecting RLS

## Error Handling
- Always use try-catch blocks for database operations
- Include specific error handling for RLS errors
- Log errors with appropriate context for debugging
- Provide meaningful error messages to clients

Example:
```typescript
try {
  const { error } = await supabase.from('table').select();
  if (error) {
    if (isRLSError(error)) {
      // Handle RLS error
    }
    throw error;
  }
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('Meaningful error message');
}
```

## Storage Operations
- Use `getSignedUrl` utility for generating storage URLs
- Always include bucket name in storage operations
- Handle storage path validation before operations

## Authentication
- JWT-based authentication using Supabase Auth
- Session persistence handled through localStorage
- Admin routes protected via middleware checks
- Use RLS fallback patterns for auth operations