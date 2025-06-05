export const logEvent = async (eventType: string, eventData?: unknown) => {
  // Always log events, using anonymous session ID when auth is disabled
  try {
    const response = await fetch('/api/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, eventData }),
    });
    
    if (!response.ok) {
      console.error('Failed to log event:', response.statusText);
    }
  } catch (error) {
    console.error('Error logging event:', error);
  }
};
