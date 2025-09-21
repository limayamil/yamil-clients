'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { Database } from '@/types/database';

interface SupabaseContextValue {
  client: SupabaseClient<Database>;
  session: Session | null;
  isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

export function SupabaseProvider({ session: initialSession, children }: { session: Session | null; children: ReactNode }) {
  const client = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get the session safely using getUser() which is secure
    const getInitialSession = async () => {
      try {
        const { data: { user }, error } = await client.auth.getUser();
        if (mounted) {
          if (user && !error) {
            // Create a session-like object from the user data
            // This avoids the security warning from getSession()
            const sessionFromUser: Session = {
              access_token: '', // Not needed for client-side usage
              refresh_token: '', // Not needed for client-side usage
              expires_in: 0, // Not needed for client-side usage
              expires_at: 0, // Not needed for client-side usage
              token_type: 'bearer',
              user: user,
            };
            setSession(sessionFromUser);
          } else {
            setSession(null);
          }
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setSession(null);
          setIsLoading(false);
        }
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setIsLoading(false);
      }
    });

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo(() => ({ client, session, isLoading }), [client, session, isLoading]);

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }
  return ctx;
}
