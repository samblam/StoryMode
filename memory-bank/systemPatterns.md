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

## Bulk Data Operations
- Use formData for file uploads and form submissions
- Validate file formats before processing
- Provide clear format requirements and examples to users
- Handle bulk operations in chunks when possible
- Include proper error handling for each record in bulk operations

Example:
```typescript
// File upload handling
const formData = await request.formData();
const file = formData.get('file') as File;

// Validate file
if (!file) {
  return new Response(JSON.stringify({ error: 'File is required' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Process file content
const fileBuffer = await file.arrayBuffer();
const fileContent = Buffer.from(fileBuffer).toString('utf-8');

// Handle bulk operations with error tracking
const errors = [];
const successes = [];

for (const record of records) {
  try {
    // Process individual record
    successes.push(record);
  } catch (error) {
    errors.push({ record, error: error.message });
  }
}

// Return comprehensive results
return new Response(JSON.stringify({ successes, errors }), {
  status: errors.length ? 207 : 200,
  headers: { 'Content-Type': 'application/json' },
});
```

## Component Organization
- Group related functionality in dedicated components
- Use tabs for organizing multiple input methods
- Provide clear feedback for user actions
- Include format requirements and examples in UI
- Handle loading and error states appropriately

Example:
```astro
<div class="tabs">
  <nav class="tab-nav">
    <!-- Tab buttons -->
  </nav>
  <div class="tab-content">
    <!-- Format requirements -->
    <div class="format-guide">
      <h3>Format Requirements</h3>
      <pre class="example"><!-- Format example --></pre>
    </div>
    <!-- Input form -->
    <form class="input-form">
      <!-- Form fields -->
    </form>
    <!-- Error/success messages -->
    <div class="feedback-message">
      <!-- User feedback -->
    </div>
  </div>
</div>