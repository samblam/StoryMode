# Decision Log

This file records architectural and implementation decisions using a list format.
2025-06-24 16:25:14 - Log of updates made.

[2025-06-24 18:20:00] - Resolved Critical Vercel Build Error

## Decision

Refactored DataExporter.astro component to eliminate the problematic `client:load` + `define:vars` combination that was causing null byte path corruption during Vercel builds.

## Rationale

The build error `[astro:build] The argument 'path' must be a string, Uint8Array, or URL without null bytes. Received '/vercel/path0/\x00astro-entry:/vercel/path0/src/components/tsconfig.json'` was caused by Vite's module resolution system getting confused when processing the `define:vars` script in combination with the `client:load` directive. This created corrupted path strings with null bytes during the build process.

## Implementation Details

1. **Removed `client:load` directive** from DataExporter usage in `src/pages/admin/surveys/[id]/results.astro`
2. **Replaced `define:vars` script** with `is:inline` script in DataExporter.astro
3. **Implemented data attribute pattern** for passing server-side data to client-side JavaScript
4. **Converted to vanilla JavaScript** with proper null checks and error handling
5. **Removed conflicting tsconfig.json** from src/components/ directory
6. **Maintained full functionality** while ensuring build compatibility

This approach follows Astro best practices for client-side hydration and avoids the complex server-client variable injection that was causing the build system to fail.