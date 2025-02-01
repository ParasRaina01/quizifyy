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
    const body = await req.json();
    const { topic, type, amount, guestSessionId } = body;

    // Validate input
    const { topic: validatedTopic, type: validatedType, amount: validatedAmount } = 
      quizCreationSchema.parse({ topic, type, amount });

    // Generate questions
    const questions = await generateQuestions(validatedTopic, validatedAmount, validatedType);
    
    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate questions" },
        { status: 500 }
      );
    }

    // Create game with properly formatted options
    const game = await prisma.game.create({
      data: {
        gameType: validatedType,
        timeStarted: new Date(),
        topic: validatedTopic,
        ...(session?.user?.id ? { userId: session.user.id } : {}),
        ...(guestSessionId ? { guestSessionId } : {}),
        questions: {
          create: questions.map((question) => {
            if (validatedType === "mcq") {
              const mcqQuestion = question as MCQQuestion;
              return {
                question: mcqQuestion.question,
                answer: mcqQuestion.answer,
                options: JSON.stringify({
                  options: [mcqQuestion.option1, mcqQuestion.option2, mcqQuestion.option3, mcqQuestion.answer]
                    .sort(() => Math.random() - 0.5),
                  answer: mcqQuestion.answer
                }),
                questionType: validatedType,
              };
            }
            return {
              question: question.question,
              answer: question.answer,
              questionType: validatedType,
            };
          }),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json({ gameId: game.id });
  } catch (error) {
    console.error("Error in game creation:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
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
