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
- **Security**: Server-only imports, proper session handling with getSession()
- **Authentication**: Use getUser() instead of getSession() for security (avoid client-side session access)

## Key Directories

- `/app` - Next.js App Router pages and layouts
- `/components` - React components organized by domain
  - `/ui` - Reusable UI components (EditableText, FileUploadDropzone, etc.)
  - `/shared` - Cross-domain components (FilesPanel, ActivityPanel, CommentsPanel)
  - `/provider` - Provider-specific components (ProjectDetailView, DashboardOverview)
  - `/client` - Client-specific components
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
- **Authentication**: Use getUser() for secure auth checks, never getSession() on client
- **Validation**: Create Zod schemas in `/lib/validators` for all forms
- **Error Handling**: Return Spanish error messages, use toast.error() for user feedback

### Component Development
- **Editable Components**: Use EditableText, EditableDate, EditableStatus patterns
- **File Management**: Use FileUploadDropzone and FilesManager components
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

  const session = await getSession();
  if (!session?.user?.id) return { error: { auth: ['No session'] } };

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