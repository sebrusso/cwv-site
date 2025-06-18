import { supabase } from './supabase/client';

export const logEvent = async (eventType: string, eventData?: unknown) => {
  // Always log events, using anonymous session ID when auth is disabled
  try {
    // Get the current session to ensure the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    // In hybrid mode, we allow anonymous events, but if there's no session
    // and we're not in a bypass-auth mode, we should not log.
    // The API route will handle the anonymous session ID generation.
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // If a session exists, pass the auth token to the API route
    if (session) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch('/api/log-event', {
      method: 'POST',
      headers,
      body: JSON.stringify({ eventType, eventData }),
    });
    
    if (!response.ok) {
      console.error(`Failed to log event: ${eventType}`, response.statusText);
    }
  } catch (error) {
    console.error('Error logging event:', error);
  }
};
