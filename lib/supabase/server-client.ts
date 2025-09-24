import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createSupabaseServerClient() {
  // Use service role client for server-side queries
  // RLS is handled at the application level with our custom auth
  const client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Explicitly type the client to ensure proper type inference
  return client as ReturnType<typeof createClient<Database>>;
}
