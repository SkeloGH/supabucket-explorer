import { defineStore } from 'pinia';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface AuthState {
  client: SupabaseClient | null;
  isAuthenticated: boolean;
  projectId: string;
  anonKey: string;
  email: string;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    client: null,
    isAuthenticated: false,
    projectId: '',
    anonKey: '',
    email: '',
  }),
  
  getters: {
    storedSession(): { projectId: string; anonKey: string; email: string } | null {
      const sessionData = localStorage.getItem('supabase-session');
      if (!sessionData) return null;
      try {
        return JSON.parse(sessionData);
      } catch {
        return null;
      }
    },
  },

  actions: {
    async login(projectId: string, email: string, password: string, anonKey: string) {
      try {
        const supabaseUrl = `https://${projectId}.supabase.co`;
        
        if (!anonKey) {
          throw new Error('Supabase anon key is required');
        }
        
        const client = createClient(supabaseUrl, anonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
          },
        });
        
        const { error } = await client.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        this.client = client;
        this.isAuthenticated = true;
        this.projectId = projectId;
        this.anonKey = anonKey;
        this.email = email;
        
        // Store session
        localStorage.setItem('supabase-session', JSON.stringify({
          projectId,
          anonKey,
          email,
        }));
        
        return { success: true };
      } catch (error: unknown) {
        console.error('Login error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: errorMessage };
      }
    },

    async restoreSession() {
      const session = this.storedSession;
      if (!session) return false;
      
      try {
        const client = createClient(`https://${session.projectId}.supabase.co`, session.anonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
          },
        });
        
        // Check if session is still valid
        const { data: { session: currentSession } } = await client.auth.getSession();
        
        if (currentSession) {
          this.client = client;
          this.isAuthenticated = true;
          this.projectId = session.projectId;
          this.anonKey = session.anonKey;
          this.email = session.email;
          return true;
        }
      } catch (error) {
        console.error('Session restore error:', error);
        this.clearSession();
      }
      
      return false;
    },

    logout() {
      this.client = null;
      this.isAuthenticated = false;
      this.projectId = '';
      this.anonKey = '';
      this.email = '';
      this.clearSession();
    },

    clearSession() {
      localStorage.removeItem('supabase-session');
    },
  },
});

