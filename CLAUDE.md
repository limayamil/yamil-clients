# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlowSync is a client-provider project management application built with Next.js 14, TypeScript, Supabase, and Tailwind CSS. It facilitates collaborative project management with staged workflows, approvals, file uploads, and real-time tracking. The application is fully localized in Spanish and features comprehensive inline editing capabilities.

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint

# Unit testing with Vitest
npm run test

# End-to-end testing with Playwright
npm run test:e2e
```

## Architecture

### App Structure (Next.js 14 App Router)
- **Route Groups**: Uses route groups for role-based layouts
  - `(auth)/` - Authentication pages
  - `(provider)/` - Provider dashboard and tools
  - `(client)/c/[clientId]/` - Client-scoped pages
- **Layouts**: Role-specific layouts with different navigation and permissions
- **API Routes**: Server actions using `next-safe-action` for type-safe API calls

### Database & Backend
- **Supabase**: PostgreSQL database with Row Level Security (RLS)
- **Authentication**: Supabase Auth with role-based access (`provider` vs `client`)
- **Storage**: File uploads to Supabase Storage (`project-files` bucket)
- **Real-time**: Supabase realtime subscriptions for live updates

### Key Domain Models
- **Projects**: Core entity with stages, deadlines, and status tracking
- **Stages**: Sequential project phases with different types (upload, checklist, approval)
- **Stage Components**: Interactive elements within stages (checklist, upload_request, approval, text_block, link, milestone, tasklist, prototype)
- **Comments**: Granular discussion system attached to projects, stages, or specific components
- **Activity Log**: Audit trail of all project actions
- **Templates**: Predefined project workflows (`template.landing`, `template.custom`)

### Frontend Architecture
- **Components**: Organized by domain (`client/`, `provider/`, `shared/`, `ui/`)
  - `ui/` contains reusable components like EditableText, EditableDate, FileUploadDropzone
  - Client vs Server Components clearly separated with 'use client' directives
- **State Management**: React Query for server state, React Context for client state
- **Forms**: Server Actions with FormData, Zod validation schemas in `/lib/validators`
- **Styling**: Tailwind CSS with custom design system, mobile-first responsive approach
- **UI Library**: Custom components built on Radix UI primitives with Spanish localization
- **Notifications**: Sonner toast system for user feedback

### Data Flow
- **Actions**: Server actions in `/actions` directory handle mutations
  - Use FormData pattern, not JSON, for Next.js 14 compatibility
  - Always include revalidatePath() after mutations
  - Proper error handling with Spanish error messages
- **Queries**: Database queries in `/lib/queries` with proper RLS
- **Validation**: Zod schemas in `/lib/validators` for type safety
- **Security**: Server-only imports, secure authentication with getUser()
- **Authentication**: Always use getUser() for authentication checks (eliminates security warnings)

## Key Directories

- `/app` - Next.js App Router pages and layouts
- `/components` - React components organized by domain
  - `/ui` - Reusable UI components (EditableText, FileUploadDropzone, etc.)
  - `/shared` - Cross-domain components (FilesPanel, ActivityPanel, ComponentCommentThread)
  - `/provider` - Provider-specific components (ProjectDetailView, StageComponentRenderer, DashboardOverview)
  - `/client` - Client-specific components (EditableStageCard, EditableStageComponents)
  - `/layout` - Shell components for navigation (ProviderShell, ClientShell)
- `/lib` - Utilities, configurations, and shared logic
  - `/validators` - Zod schemas for form validation
  - `/supabase` - Supabase client configurations (browser-client, server-client)
  - `/auth` - Authentication utilities and guards
- `/actions` - Server actions for mutations (projects.ts, files.ts, stages.ts)
- `/types` - TypeScript type definitions (project.ts, database.ts)
- `/hooks` - Custom React hooks (use-debounce.ts)
- `/supabase` - Database migrations and edge functions

## Design System

The application follows a custom design system documented in `design.md`:
- **Brand Colors**: Primary blue palette with semantic color variants
- **Typography**: Inter for UI, Source Sans 3 for headings
- **Components**: Card-based UI with 24px border radius
- **Spacing**: 8px grid system
- **States**: Comprehensive status system for projects and stages

## Configuration Notes

- **Experimental Features**: Server Actions with 4MB body limit, typed routes enabled
- **Internationalization**: Multi-language support with `next-intl`
- **Build Optimization**: ESLint configured for app, components, lib, actions, and server directories
- **Instrumentation**: Custom instrumentation hook enabled for observability

## Development Guidelines

### Server vs Client Components
- **Server Components**: Use for data fetching and static content (pages, layouts)
- **Client Components**: Use for interactivity and event handlers (forms, modals, interactive components)
- **CRITICAL**: Always add `'use client';` when passing event handlers or using React hooks
- **File uploads**: Must use Client Components for browser APIs

### Data Patterns
- **Server Actions**: Use FormData, not JSON objects
- **Mutations**: Always call revalidatePath() after database changes
- **Authentication**: Always use getUser() for secure auth checks (replaces deprecated getSession())
- **Validation**: Create Zod schemas in `/lib/validators` for all forms
- **Error Handling**: Return Spanish error messages, use toast.error() for user feedback

### Component Development
- **Editable Components**: Use EditableText, EditableDate, EditableStatus patterns
- **File Management**: Use FileUploadDropzone and FilesManager components
- **Comments System**: Use ComponentCommentThread for granular discussions on specific components
- **Component Integration**: Pass `projectId` and `comments` props to stage components for comment functionality
- **Loading States**: Always include loading props and visual feedback
- **Responsive Design**: Mobile-first approach with touch-friendly targets (h-11 minimum)
- **Accessibility**: Include ARIA labels, keyboard navigation, and semantic HTML

### Styling & UX
- **Spanish Localization**: All UI text must be in Spanish
- **Toast Messages**: Use Sonner with Spanish messages for feedback
- **Mobile Experience**: Ensure touch targets are 44px+ and navigation works on mobile
- **Performance**: Use React.memo, useMemo, and debouncing for heavy operations

### Security & Best Practices
- **RLS Policies**: Maintain proper Row Level Security for all database operations
- **File Uploads**: Validate file types, sizes, and sanitize filenames
- **Rate Limiting**: Apply rate limiting to server actions
- **Audit Trails**: Use audit() function for important actions
- **Type Safety**: Maintain strict TypeScript types throughout the codebase

### Testing & Build
- **Always run**: `npm run build` before committing to catch compilation errors
- **Lint regularly**: `npm run lint` to maintain code quality
- **Test build**: Ensure static generation warnings are acceptable (auth pages will use cookies)

## Authentication System & Session Management

### Simple JWT Authentication System (Sept 2025)
The authentication system was completely replaced with a custom JWT-based system for better production reliability and Edge Runtime compatibility:

#### Key Features
- **Email-only Login**: Simplified authentication without passwords - users enter email and get authenticated directly
- **Custom JWT Implementation**: Pure JavaScript base64 encoding/decoding for Netlify Edge Runtime compatibility
- **Simple Users Table**: New `simple_users` table separate from Supabase Auth for better control
- **UUID Preservation**: Migrated existing user UUIDs to maintain data continuity
- **Production-ready**: Comprehensive error handling, logging, and fallback mechanisms

#### Edge Runtime Compatibility Solutions
**CRITICAL**: Netlify Edge Runtime doesn't support `atob()` function, causing `InvalidCharacterError`:

```typescript
// ❌ Problematic - fails in Netlify Edge Runtime
const decoded = atob(base64String);

// ✅ Solution - Pure JavaScript implementation
const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const base64Lookup = new Array(256);
for (let i = 0; i < base64Chars.length; i++) {
  base64Lookup[base64Chars.charCodeAt(i)] = i;
}

function base64ToUtf8(str: string): string {
  const cleanStr = str.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array((cleanStr.length * 3) / 4);
  let byteIndex = 0;

  for (let i = 0; i < cleanStr.length; i += 4) {
    const char1 = base64Lookup[cleanStr.charCodeAt(i)] || 0;
    const char2 = base64Lookup[cleanStr.charCodeAt(i + 1)] || 0;
    const char3 = base64Lookup[cleanStr.charCodeAt(i + 2)] || 0;
    const char4 = base64Lookup[cleanStr.charCodeAt(i + 3)] || 0;

    const bitmap = (char1 << 18) | (char2 << 12) | (char3 << 6) | char4;

    if (i + 1 < cleanStr.length) bytes[byteIndex++] = (bitmap >> 16) & 255;
    if (i + 2 < cleanStr.length) bytes[byteIndex++] = (bitmap >> 8) & 255;
    if (i + 3 < cleanStr.length) bytes[byteIndex++] = bitmap & 255;
  }

  return new TextDecoder().decode(bytes.slice(0, byteIndex));
}
```

#### JWT Token Structure
```typescript
// Custom JWT implementation with Edge-compatible encoding
const header = { alg: 'simple', typ: 'JWT' };
const payload = {
  userId: string,
  email: string,
  role: 'provider' | 'client',
  iat: number,
  exp: number  // 30 days expiration
};
const signature = base64(JWT_SECRET + encodedHeader + encodedPayload).substring(0, 32);
const token = `${encodedHeader}.${encodedPayload}.${signature}`;
```

#### Production Authentication Issues & Solutions
**Common Issue**: Provider authentication fails while client works in production:

1. **Base64 Decoding Failures**: Use pure JavaScript implementation, never rely on `atob()`
2. **JWT Verification Errors**: Implement comprehensive error handling with fallbacks
3. **Cookie Parsing Issues**: Handle malformed cookies gracefully
4. **Character Encoding**: Use TextEncoder/TextDecoder for proper UTF-8 handling

#### Migration from Supabase Auth
```sql
-- Create simple_users table
CREATE TABLE simple_users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('provider', 'client')),
  name text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Migrate existing UUIDs to preserve data relationships
UPDATE simple_users SET id = '26258cab-520f-499e-84c3-33dc04419e02'
WHERE email = 'yamillues@gmail.com';
```

#### Key Implementation Files
- **`/lib/auth/simple-auth.ts`**: Core JWT authentication system with Edge Runtime compatibility
- **`/middleware.ts`**: Route protection using custom JWT verification
- **`/supabase/migrations/0015_simple_auth_system.sql`**: Database schema for new auth system
- **`/supabase/migrations/0016_migrate_existing_uuids.sql`**: UUID migration for data continuity

### Legacy Session Management (Pre-Sept 2025)
The previous authentication system used Supabase Auth with the following features:

#### Key Improvements (Early Sept 2025)
- **Persistent Sessions**: "Remember Me" checkbox enables 30-day session persistence
- **Rate Limiting**: Intelligent backoff with 2-second base delay and reduced retry attempts
- **Session Cache**: Extended from 5 to 60 seconds for better stability
- **Middleware**: Enhanced auth handling with automatic redirects for protected routes
- **Error Handling**: Improved UX with specific error messages and loading states

#### FormData Validation Pattern
**CRITICAL**: When handling FormData with boolean values, use proper schema validation:

```typescript
// ✅ Correct schema for FormData boolean fields
export const formSchema = z.object({
  rememberMe: z
    .union([z.boolean(), z.string()])
    .transform((value) => {
      if (typeof value === 'boolean') return value;
      return value === 'true' || value === 'on';
    })
    .optional()
    .default(false)
});

// ❌ Wrong - fails with FormData strings
export const formSchema = z.object({
  rememberMe: z.boolean().optional().default(false)
});
```

**Problem**: FormData sends boolean checkbox values as strings (`'true'`/`'false'`), not actual booleans. If the schema expects boolean but receives string, validation fails silently and server actions return errors instead of proceeding.

#### Session Configuration
```typescript
// Persistent cookies for "Remember Me" functionality
if (rememberMe && data.session) {
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  cookieStore.set('sb-access-token', data.session.access_token, {
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}
```

#### Rate Limiting Configuration
```typescript
// Optimized for better UX
export async function handleAuthRateLimit<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,      // Reduced from 3
  baseDelay: number = 2000     // Increased from 1000ms
): Promise<T> {
  // Exponential backoff: 1.5x instead of 2x for gentler progression
  const delay = baseDelay * Math.pow(1.5, attempt) + Math.random() * 500;
}
```

### Login Flow Debugging
If login issues occur, check:
1. **FormData validation**: Ensure schema handles string→boolean conversion
2. **Session creation**: Verify Supabase auth response contains user and session
3. **Role assignment**: User must have `user_metadata.role` set to 'provider' or 'client'
4. **Middleware conflicts**: Check middleware isn't blocking protected routes unnecessarily

## Common Patterns & Solutions

### Editable Project Information
```typescript
// Use EditableText for inline editing
<EditableText
  value={project.title}
  onSave={handleUpdateTitle}
  placeholder="Título del proyecto"
  maxLength={200}
/>

// Use EditableDate for date fields
<EditableDate
  value={project.deadline}
  onSave={handleUpdateDeadline}
  placeholder="Sin fecha límite"
/>
```

### Server Actions Pattern
```typescript
export async function updateProject(formData: FormData) {
  const parsed = updateProjectSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const user = await getUser();
  if (!user?.id) return { error: { auth: ['No user'] } };

  // Database operation
  const { error } = await supabase.from('projects').update(data).eq('id', projectId);
  if (error) return { error: { db: [error.message] } };

  // Audit and revalidate
  await audit({ projectId, actorType: 'provider', action: 'project.updated' });
  revalidatePath(`/projects/${projectId}`);

  return { success: true };
}
```

### File Upload Pattern
```typescript
// Client Component with FileUploadDropzone
const handleUpload = async (files: File[]) => {
  const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser-client');
  const supabase = createSupabaseBrowserClient();

  // Upload to storage first
  const { error } = await supabase.storage.from('project-files').upload(path, file);

  // Then record in database via server action
  const result = await uploadFileRecord(formData);
};
```

### Mobile-Responsive Patterns
```typescript
// Touch-friendly buttons
<Button className="h-11 w-11 touch-manipulation">

// Responsive spacing
<div className="px-4 sm:px-6">

// Hidden text on small screens
<span className="hidden sm:inline">Texto completo</span>
```

### Component-Level Comments Pattern
```typescript
// Use ComponentCommentThread for granular discussions
<ComponentCommentThread
  componentId={component.id}
  componentTitle="Upload Request"
  projectId={project.id}
  comments={project.comments || []}
  isCompact={true}
/>
```

### Stage Component Integration
```typescript
// StageComponentRenderer usage in provider view
<StageComponentRenderer
  stage={stage}
  projectId={project.id}
  comments={project.comments || []}
/>

// EditableStageComponents usage in client view
<EditableStageComponents
  components={stage.components || []}
  stageId={stage.id}
  projectId={project.id}
  comments={project.comments || []}
  onUpdateComponent={onUpdateComponent}
  onDeleteComponent={onDeleteComponent}
  readonly={false}
/>
```

## Comments System Architecture

### Database Schema
- **comments** table supports three levels of granularity:
  - `project_id`: Project-level discussions (deprecated in favor of component-level)
  - `stage_id`: Stage-level discussions
  - `component_id`: Component-level discussions (primary method)

### Comment Flow
1. **Component-Level**: Each stage component has its own comment thread
2. **Contextual**: Comments are displayed inline with the component they reference
3. **Expandable**: Comments start collapsed and expand when clicked
4. **Real-time**: Uses existing server actions and revalidation patterns

### Implementation Notes
- **Backward Compatibility**: Existing comments system still functions
- **Migration**: Project-level comments replaced with component-specific discussions
- **UI**: Compact collapsed state with full expansion for detailed discussions
- **Access Control**: Same RLS policies apply to component-level comments

### Client Name Display in Comments (September 2024)
**IMPORTANT**: Both component-level and stage-level comments now display the client's first name instead of generic "(Cliente)" label.

#### Implementation Details
- **Data Source**: Uses `project.client_name` field from project data (e.g., "Celeste Panelli")
- **First Name Extraction**: `clientName?.split(' ')[0] || 'Cliente'` extracts "Celeste"
- **Fallback**: Gracefully falls back to "Cliente" if no client name is provided
- **Scope**: Applied to both `ComponentCommentThread` and `StageCommentThread`

#### Technical Implementation
```typescript
// Helper function (used in both comment components)
const getClientFirstName = (fullName?: string): string => {
  if (!fullName) return 'Cliente';
  return fullName.split(' ')[0] || 'Cliente';
};

// Badge rendering (consistent across both components)
<Badge variant={comment.author_type === 'provider' ? 'default' : 'secondary'}>
  {comment.author_type === 'provider' ? 'Proveedor' : getClientFirstName(clientName)}
</Badge>
```

#### Updated Components
**Component-Level Comments**:
- `ComponentCommentThread` - Accepts `clientName?: string` prop
- All stage component renderers updated to pass `clientName={project.client_name}`
- Applied to: `StageComponentRenderer`, `EditableStageComponents`, `ClientStageComponents`, `ProviderStageComponents`

**Stage-Level Comments**:
- `StageCommentThread` - Accepts `clientName?: string` prop
- Updated in both provider and client project detail views
- Applied to: `project-detail-view.tsx`, `client-project-detail.tsx`

#### Prop Flow Chain
```typescript
// 1. Project data provides client_name
project.client_name →

// 2. Main detail views pass to stage cards
<EditableStageCard clientName={project.client_name} /> →

// 3. Stage cards pass to component renderers
<ClientStageComponents clientName={clientName} /> →

// 4. Component renderers pass to comment threads
<ComponentCommentThread clientName={clientName} />

// For stage comments: Direct pass from detail views
<StageCommentThread clientName={project.client_name} />
```

#### Expected Results
- Component comments: **(Celeste)** instead of **(Cliente)**
- Stage comments: **(Celeste)** instead of **(Cliente)**
- Provider comments: **(Proveedor)** (unchanged)
- Works in both provider (`/projects/[id]`) and client (`/c/[clientId]/projects/[id]`) views

## Critical Debugging & Development Patterns

### Dual-View Architecture Debugging
**IMPORTANT**: FlowSync has TWO separate views with different data sources that must BOTH be considered:

#### Provider View (`/projects/[projectId]`)
- **Data Source**: `getProviderProject()` in `/lib/queries/provider.ts`
- **RPC Function**: `provider_project_detail`
- **Components**: Uses `StageComponentRenderer` and provider-specific components

#### Client View (`/c/[clientId]/projects/[projectId]`)
- **Data Source**: `getClientProject()` in `/lib/queries/client.ts`
- **RPC Function**: `client_project_detail`
- **Components**: Uses `EditableStageComponents` and client-specific components

### Common Debugging Mistake
When troubleshooting data issues (especially missing fields like `title` in stage_components):

❌ **Wrong Approach**: Only checking one view or assuming both use the same data source
✅ **Correct Approach**: Always verify BOTH `getProviderProject()` AND `getClientProject()` functions

### RPC Function Issues
Both RPC functions (`provider_project_detail` and `client_project_detail`) may not include all necessary fields:
- If RPC returns incomplete data, implement fallback to direct SQL queries
- Always explicitly specify required fields in `stage_components` selection
- Test changes in BOTH provider and client views

### Debugging Checklist for Data Issues
1. **Identify the current view**: Provider (`/projects/`) vs Client (`/c/`)
2. **Check the correct data source**: `getProviderProject` vs `getClientProject`
3. **Verify RPC vs direct queries**: RPC may return incomplete data
4. **Test in both views**: Changes must work for both provider and client interfaces
5. **Check explicit field selection**: Use `stage_components (id, title, config, ...)` instead of `(*)`

### Stage Components Debugging Pattern
**CRITICAL**: Stage components have complex data mapping that can fail at multiple points:

#### Data Flow for Stage Components
1. **Database**: `stage_components` table contains the actual component data
2. **RPC Functions**: `provider_project_detail` and `client_project_detail` aggregate components into `stages.components`
3. **Query Mapping**: Both query functions map `stage.stage_components` → `stage.components`
4. **Component Rendering**: `StageComponentRenderer` and `EditableStageComponents` expect `stage.components[]`

#### Common Stage Component Issues
**Problem**: "Components not showing in provider/client view"

**Debugging Steps**:
1. **Verify RPC Output**: Check if RPC returns `stage_components` correctly nested in stages
2. **Check Data Mapping**: Ensure `stage.stage_components` is properly mapped to `stage.components`
3. **Validate Component Structure**: Components need `id`, `component_type`, `title`, `config` fields
4. **Test Fallback Queries**: If RPC fails, direct queries should provide same data structure
5. **Console Log Data**: Add temporary logging to trace data transformation

#### Expected Data Structure
```typescript
// Expected structure after query transformation
stage: {
  id: string,
  title: string,
  components: [  // ← Must be named 'components', not 'stage_components'
    {
      id: string,
      component_type: 'upload_request' | 'checklist' | 'approval' | 'text_block' | etc.,
      title: string,
      config: Record<string, any>,
      status: string,
      metadata: Record<string, any>
    }
  ]
}
```

#### Component Rendering Validation
```typescript
// Both renderers check for empty components
if (!stage.components || stage.components.length === 0) {
  return <p>No components configured.</p>;
}

// Ensure components are properly mapped during query transformation
const transformedStages = rawStages.map((stage: any) => ({
  ...stage,
  components: stage.stage_components || []  // ← Critical mapping
}));
```