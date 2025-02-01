import MCQ from "@/components/MCQ";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/nextauth";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  params: {
    gameId: string;
  };
};

const MCQPage = async ({ params: { gameId } }: Props) => {
  const session = await getAuthSession();
  
  // Find the game with full question details
  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
    },
    include: {
      questions: {
        select: {
          id: true,
          question: true,
          options: true,
          answer: true,
          questionType: true,
        },
      },
      guestSession: true,
    },
  });

  if (!game || game.gameType !== "mcq") {
    return redirect("/");
  }

  // If game belongs to a user (not guest) and no session, redirect to home
  if (game.userId && !session?.user) {
    return redirect("/");
  }

  return <MCQ game={game} isGuest={!!game.guestSessionId} />;
};

export default MCQPage;
