import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateGuestSession } from '@/lib/guestSession';

export async function POST(req: Request) {
  try {
    if (!prisma) {
      throw new Error('Prisma client is not initialized');
    }

    const { sessionId, answers, topic } = await req.json();

    const isValidSession = await validateGuestSession(sessionId);
    if (!isValidSession) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Create a game entry for the guest
    const game = await prisma.game.create({
      data: {
        gameType: 'mcq',
        timeStarted: new Date(),
        topic: topic || 'General Quiz',
        guestSessionId: sessionId,
      },
    });

    return NextResponse.json({ success: true, gameId: game.id });
  } catch (error) {
    console.error('Error submitting guest test:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit test'
      },
      { status: 500 }
    );
  }
} 