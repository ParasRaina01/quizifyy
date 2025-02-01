'use client';

import { signOut } from 'next-auth/react';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleSignOut}
      disabled={isLoading}
      className="w-full sm:w-auto"
    >
      <LogOut className="w-4 h-4 mr-2" />
      {isLoading ? 'Signing out...' : 'Sign out'}
    </Button>
  );
} 