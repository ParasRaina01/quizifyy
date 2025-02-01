import { useState, useEffect } from 'react';

export function useGuestSession() {
  const [isGuest, setIsGuest] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const guestSessionId = localStorage.getItem('guestSessionId');
    if (guestSessionId) {
      setIsGuest(true);
      setSessionId(guestSessionId);
    }
  }, []);

  const clearGuestSession = () => {
    localStorage.removeItem('guestSessionId');
    setIsGuest(false);
    setSessionId(null);
  };

  return {
    isGuest,
    sessionId,
    clearGuestSession,
  };
} 