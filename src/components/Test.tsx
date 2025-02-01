import { useGuestSession } from '@/hooks/useGuestSession';

export default function Test() {
  const { isGuest, sessionId } = useGuestSession();
  
  // ... existing state and other code

  const handleSubmitTest = async (answers: Answer[]) => {
    try {
      const endpoint = isGuest ? '/api/guest/test' : '/api/test';
      const payload = isGuest ? {
        sessionId,
        answers,
      } : {
        answers,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        if (isGuest) {
          // Show registration prompt
          setShowRegistrationPrompt(true);
        }
        // Handle test completion
        router.push('/results');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
    }
  };

  // ... rest of the component
} 