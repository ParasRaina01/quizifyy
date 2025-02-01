import { getAuthSession } from "@/lib/nextauth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Get the pending game and session IDs from query params
    const pendingGameId = req.cookies.get('pendingGameId')?.value;
    const pendingGuestSessionId = req.cookies.get('pendingGuestSessionId')?.value;

    if (pendingGameId && pendingGuestSessionId) {
      // Get client-side questions from cookies
      const questions = JSON.parse(req.cookies.get('pendingQuestions')?.value || '[]');

      // Create game with questions
      const updatedGame = await prisma.game.update({
        where: { 
          id: pendingGameId,
          guestSessionId: pendingGuestSessionId
        },
        data: {
          userId: session.user.id,
          guestSessionId: null,
          questions: {
            create: questions.map((q: any) => ({
              question: q.question,
              answer: q.answer,
              options: q.options,
              questionType: "mcq",
            })),
          },
        },
      });

      // Clean up the guest session
      await prisma.guestSession.delete({
        where: { id: pendingGuestSessionId },
      });

      // Clear cookies
      const response = NextResponse.redirect(new URL(`/statistics/${pendingGameId}`, req.url));
      response.cookies.delete('pendingGameId');
      response.cookies.delete('pendingGuestSessionId');
      
      return response;
    }

    return NextResponse.redirect(new URL('/', req.url));
  } catch (error) {
    console.error('Error converting guest session:', error);
    return NextResponse.redirect(new URL('/', req.url));
  }
} 