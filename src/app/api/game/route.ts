import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/nextauth";
import { generateQuestions, MCQQuestion, OpenEndedQuestion } from "@/lib/questions";
import { quizCreationSchema } from "@/schemas/forms/quiz";
import { GameType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request, res: Response) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a game." },
        {
          status: 401,
        }
      );
    }
    const body = await req.json();
    const { topic, type, amount } = quizCreationSchema.parse(body);

    // Generate questions directly using the service
    const questions = await generateQuestions(topic, amount, type);

    // If we got questions successfully, create the game and questions in a transaction
    return await prisma.$transaction(async (tx) => {
      const game = await tx.game.create({
        data: {
          gameType: type,
          timeStarted: new Date(),
          userId: session.user.id,
          topic,
        },
      });

      await tx.topic_count.upsert({
        where: {
          topic,
        },
        create: {
          topic,
          count: 1,
        },
        update: {
          count: {
            increment: 1,
          },
        },
      });

      if (type === "mcq") {
        const manyData = (questions as MCQQuestion[]).map((question) => {
          const options = [
            question.option1,
            question.option2,
            question.option3,
            question.answer,
          ].sort(() => Math.random() - 0.5);
          return {
            question: question.question,
            answer: question.answer,
            options: JSON.stringify(options),
            gameId: game.id,
            questionType: type,
          };
        });

        await tx.question.createMany({
          data: manyData,
        });
      } else if (type === "open_ended") {
        await tx.question.createMany({
          data: (questions as OpenEndedQuestion[]).map((question) => {
            return {
              question: question.question,
              answer: question.answer,
              gameId: game.id,
              questionType: type,
            };
          }),
        });
      }

      return NextResponse.json({ gameId: game.id }, { status: 200 });
    });
  } catch (error) {
    console.error("Error creating game:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues },
        {
          status: 400,
        }
      );
    } else {
      return NextResponse.json(
        { error: "An unexpected error occurred while creating the game." },
        {
          status: 500,
        }
      );
    }
  }
}

export async function GET(req: Request, res: Response) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to view games." },
        {
          status: 401,
        }
      );
    }
    const url = new URL(req.url);
    const gameId = url.searchParams.get("gameId");
    if (!gameId) {
      return NextResponse.json(
        { error: "You must provide a game id." },
        {
          status: 400,
        }
      );
    }

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
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found." },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      { game },
      {
        status: 200
      }
    );
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      {
        status: 500,
      }
    );
  }
}
