'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';

export default function GuestTestButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGuestTest = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/guest/session', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('guestSessionId', data.sessionId);
        // Route to quiz creation with guest flag
        router.push('/quiz?guest=true');
      } else {
        throw new Error(data.error || 'Failed to create guest session');
      }
    } catch (error) {
      console.error('Error starting guest test:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGuestTest}
      disabled={loading}
      className="w-full py-6 bg-primary hover:bg-primary/90"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : (
        <Play className="w-5 h-5 mr-2" />
      )}
      Start Quiz as Guest
    </Button>
  );
} 