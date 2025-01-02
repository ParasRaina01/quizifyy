import { getAuthSession } from "@/lib/nextauth";
import { generateQuestions } from "@/lib/questions";
import { getQuestionsSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(req: Request, res: Response) {
  try {
    const session = await getAuthSession();
    const body = await req.json();
    const { amount, topic, type } = getQuestionsSchema.parse(body);

    try {
      const questions = await generateQuestions(topic, amount, type);

      if (!questions || questions.length === 0) {
        console.error("No questions generated for topic:", topic);
        return NextResponse.json(
          { error: "Failed to generate questions. Please try again." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          questions: questions,
        },
        {
          status: 200,
        }
      );
    } catch (genError) {
      console.error("Error generating questions:", genError);
      return NextResponse.json(
        { error: "Failed to generate questions. Please try a different topic or try again later." },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues },
        {
          status: 400,
        }
      );
    } else {
      console.error("Unexpected error in questions API:", error);
      return NextResponse.json(
        { error: "An unexpected error occurred." },
        {
          status: 500,
        }
      );
    }
  }
}
