"use client";
import { Game, Question } from "@prisma/client";
import React from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { differenceInSeconds } from "date-fns";
import Link from "next/link";
import { BarChart, ChevronRight, Loader2, Timer } from "lucide-react";
import { checkAnswerSchema } from "@/schemas/questions";
import { cn, formatTimeDelta } from "@/lib/utils";
import MCQCounter from "./MCQCounter";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";
import { useToast } from "./ui/use-toast";
import { Progress } from "./ui/progress";

type Props = {
  game: Game & { questions: Pick<Question, "id" | "options" | "question">[] };
};

const MCQ = ({ game }: Props) => {
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [hasEnded, setHasEnded] = React.useState(false);
  const [stats, setStats] = React.useState({
    correct_answers: 0,
    wrong_answers: 0,
  });
  const [selectedChoice, setSelectedChoice] = React.useState<number>(0);
  const [now, setNow] = React.useState(new Date());

  const currentQuestion = React.useMemo(() => {
    return game.questions[questionIndex];
  }, [questionIndex, game.questions]);

  const options = React.useMemo(() => {
    if (!currentQuestion?.options) return [];
    try {
      const parsedOptions = JSON.parse(currentQuestion.options as string);
      return Array.isArray(parsedOptions) ? parsedOptions : [];
    } catch (error) {
      console.error("Error parsing options:", error);
      return [];
    }
  }, [currentQuestion]);

  const { toast } = useToast();
  const { mutate: checkAnswer, isLoading: isChecking } = useMutation({
    mutationFn: async () => {
      const payload: z.infer<typeof checkAnswerSchema> = {
        questionId: currentQuestion.id,
        userInput: options[selectedChoice],
      };
      const response = await axios.post(`/api/checkAnswer`, payload);
      return response.data;
    },
  });

  const { mutate: endGame } = useMutation({
    mutationFn: async () => {
      const payload = {
        gameId: game.id,
      };
      const response = await axios.post(`/api/endGame`, payload);
      return response.data;
    },
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!hasEnded) {
        setNow(new Date());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hasEnded]);

  const handleNext = React.useCallback(() => {
    if (!currentQuestion) return;
    checkAnswer(undefined, {
      onSuccess: ({ isCorrect }) => {
        if (isCorrect) {
          setStats((stats) => ({
            ...stats,
            correct_answers: stats.correct_answers + 1,
          }));
          toast({
            title: "Correct!",
            description: "Good job! Keep going!",
            variant: "success",
          });
        } else {
          setStats((stats) => ({
            ...stats,
            wrong_answers: stats.wrong_answers + 1,
          }));
          toast({
            title: "Incorrect",
            description: "Don't worry, keep trying!",
            variant: "destructive",
          });
        }
        if (questionIndex === game.questions.length - 1) {
          endGame();
          setHasEnded(true);
          return;
        }
        setQuestionIndex((prev) => prev + 1);
        setSelectedChoice(0);
      },
    });
  }, [checkAnswer, questionIndex, game.questions.length, toast, endGame, currentQuestion]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "1") setSelectedChoice(0);
      else if (event.key === "2") setSelectedChoice(1);
      else if (event.key === "3") setSelectedChoice(2);
      else if (event.key === "4") setSelectedChoice(3);
      else if (event.key === "Enter") handleNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleNext]);

  if (hasEnded) {
    return (
      <div className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
        <div className="px-4 py-2 mt-2 font-semibold text-white bg-green-500 rounded-md whitespace-nowrap">
          Quiz Completed in{" "}
          {formatTimeDelta(differenceInSeconds(now, game.timeStarted))}
        </div>
        <Link
          href={`/statistics/${game.id}`}
          className={cn("mt-4 bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-all flex items-center")}
        >
          View Statistics
          <BarChart className="w-4 h-4 ml-2" />
        </Link>
      </div>
    );
  }

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 md:w-[80vw] max-w-4xl w-[90vw] top-1/2 left-1/2">
      <div className="flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-bold">{game.topic}</h3>
            <div className="flex items-center text-muted-foreground">
              <Timer className="w-4 h-4 mr-2" />
              {formatTimeDelta(differenceInSeconds(now, game.timeStarted))}
            </div>
          </div>
          <MCQCounter
            correct_answers={stats.correct_answers}
            wrong_answers={stats.wrong_answers}
          />
        </div>

        <Progress value={(questionIndex / game.questions.length) * 100} className="h-2" />

        <Card className="w-full mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">
                Question {questionIndex + 1} of {game.questions.length}
              </CardTitle>
              <div className="text-muted-foreground text-lg font-semibold">
                {Math.round((questionIndex / game.questions.length) * 100)}% Complete
              </div>
            </div>
            <CardDescription className="text-xl mt-4">
              {currentQuestion?.question}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-4">
            <div className="flex flex-col gap-4">
              {options.map((option, index) => {
                return (
                  <Button
                    key={`${currentQuestion.id}-${option}-${index}`}
                    variant={selectedChoice === index ? "default" : "outline"}
                    className={cn(
                      "p-8 justify-start items-center text-lg hover:border-primary",
                      selectedChoice === index && "border-2 border-primary bg-primary/10"
                    )}
                    onClick={() => setSelectedChoice(index)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-2 px-3 rounded-md font-semibold">
                        {index + 1}
                      </div>
                      <div className="text-start">{option}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
            <Button
              className="w-full mt-6 text-lg p-6 bg-slate-800 hover:bg-slate-700 transition-all"
              disabled={isChecking || options.length === 0}
              onClick={handleNext}
            >
              {isChecking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Next Question
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MCQ;
