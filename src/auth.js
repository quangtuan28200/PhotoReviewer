// === Auth Module ===
// Manages authentication via Supabase (Google OAuth)

import { supabase } from './supabase.js';

let cachedUser = null;

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) {
    throw error;
  }
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
  cachedUser = null;
}

export function onAuthChange(callback) {
  // Return current session immediately if available
  supabase.auth.getSession().then(({ data: { session } }) => {
    cachedUser = session?.user || null;
    callback(cachedUser);
  });

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    cachedUser = session?.user || null;
    callback(cachedUser);
  });

  return subscription;
}

/**
 * Sync function to get current user from cache.
 * Falls back to null if not initialized yet.
 */
export function getCurrentUser() {
  return cachedUser;
}
