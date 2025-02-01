import { prisma } from '@/lib/db';

export async function validateGuestSession(sessionId: string) {
  try {
    const session = await prisma.guestSession.findFirst({
      where: {
        id: sessionId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
    return !!session;
  } catch (error) {
    console.error('Error validating guest session:', error);
    return false;
  }
} 