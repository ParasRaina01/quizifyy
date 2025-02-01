'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

interface RegistrationPromptProps {
  open: boolean;
  onClose: () => void;
  gameId: string;
  guestSessionId?: string;
}

export default function RegistrationPrompt({ 
  open, 
  onClose, 
  gameId,
  guestSessionId 
}: RegistrationPromptProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      // Store IDs in cookies instead of localStorage
      document.cookie = `pendingGameId=${gameId}; path=/`;
      if (guestSessionId) {
        document.cookie = `pendingGuestSessionId=${guestSessionId}; path=/`;
      }
      
      await signIn('google', { 
        callbackUrl: '/api/auth/convert-guest-session'
      });
    } catch (error) {
      console.error('Error during sign in:', error);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl sm:text-2xl">Save Your Results</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Create an account to save your quiz results and unlock detailed statistics and insights.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Loading...' : 'Sign in with Google'}
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 