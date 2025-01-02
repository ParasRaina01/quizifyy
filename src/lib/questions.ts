import { generate_quiz } from "@/lib/gemini";
import { GameType } from "@prisma/client";

export type MCQQuestion = {
  question: string;
  answer: string;
  option1: string;
  option2: string;
  option3: string;
};

export type OpenEndedQuestion = {
  question: string;
  answer: string;
};

export async function generateQuestions(
  topic: string,
  amount: number,
  type: GameType
): Promise<MCQQuestion[] | OpenEndedQuestion[]> {
  if (type === "open_ended") {
    return await generate_quiz(
      "You are a helpful AI that is able to generate a pair of question and answers, the length of each answer should not be more than 15 words, store all the pairs of answers and questions in a JSON array",
      new Array(amount).fill(
        `You are to generate a random hard open-ended questions about ${topic}`
      ),
      {
        question: "question",
        answer: "answer with max length of 15 words",
      }
    );
  } else if (type === "mcq") {
    return await generate_quiz(
      "You are a helpful AI that is able to generate mcq questions and answers, the length of each answer should not be more than 15 words, store all answers and questions and options in a JSON array",
      new Array(amount).fill(
        `You are to generate a random hard mcq question about ${topic}`
      ),
      {
        question: "question",
        answer: "answer with max length of 15 words",
        option1: "option1 with max length of 15 words",
        option2: "option2 with max length of 15 words",
        option3: "option3 with max length of 15 words",
      }
    );
  }
  throw new Error("Invalid question type");
} 