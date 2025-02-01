import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    if (!prisma) {
      throw new Error('Prisma client is not initialized');
    }

    // Create a guest session
    const guestSession = await prisma.guestSession.create({
      data: {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ 
      success: true, 
      sessionId: guestSession.id
    });
    
  } catch (error) {
    console.error('Error creating guest session:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create guest session'
      },
      { status: 500 }
    );
  }
} 