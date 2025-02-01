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
import RegistrationPrompt from "./RegistrationPrompt";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

type Props = {
  game: Game & {
    questions: Question[];
  };
  isGuest?: boolean;
};

interface MCQQuestion {
  options: string[];
  answer: string;
}

const MCQ = ({ game, isGuest }: Props) => {
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [selectedChoice, setSelectedChoice] = React.useState<number>(0);
  const [correctAnswers, setCorrectAnswers] = React.useState(0);
  const [wrongAnswers, setWrongAnswers] = React.useState(0);
  const [hasEnded, setHasEnded] = React.useState(false);
  const [now, setNow] = React.useState(new Date());
  const [showRegistrationPrompt, setShowRegistrationPrompt] = React.useState(false);
  const [endTime, setEndTime] = React.useState<Date | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  const currentQuestion = React.useMemo(() => {
    return game.questions[questionIndex];
  }, [questionIndex, game.questions]);

  // Parse options from the JSON string
  const questionData = React.useMemo(() => {
    if (!currentQuestion?.options) return { options: [], answer: '' };
    try {
      return JSON.parse(currentQuestion.options as string) as MCQQuestion;
    } catch (e) {
      console.error('Error parsing question options:', e);
      return { options: [], answer: '' };
    }
  }, [currentQuestion]);

  const { mutate: checkAnswer, isLoading: isChecking } = useMutation({
    mutationFn: async () => {
      const payload: z.infer<typeof checkAnswerSchema> = {
        questionId: currentQuestion.id,
        userInput: questionData.options[selectedChoice],
      };
      const response = await axios.post(`/api/checkAnswer`, payload);
      return response.data;
    },
  });

  React.useEffect(() => {
    if (hasEnded && !endTime) {
      setEndTime(new Date());
      return;
    }

    const interval = setInterval(() => {
      if (!hasEnded) {
        setNow(new Date());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hasEnded, endTime]);

  const handleNext = async () => {
    if (isChecking) return;

    checkAnswer(undefined, {
      onSuccess: (data) => {
        if (data.isCorrect) {
          setCorrectAnswers((prev) => prev + 1);
          toast({
            title: "Correct!",
            description: "Good job! On to the next question.",
            variant: "success",
          });
        } else {
          setWrongAnswers((prev) => prev + 1);
          toast({
            title: "Wrong!",
            description: `The correct answer was ${data.correctAnswer}`,
            variant: "destructive",
          });
        }

        if (questionIndex === game.questions.length - 1) {
          setHasEnded(true);
          setEndTime(new Date());
          if (isGuest) {
            setShowRegistrationPrompt(true);
          }
          return;
        }
        setQuestionIndex((prev) => prev + 1);
        setSelectedChoice(0);
      },
    });
  };

  const handleStatisticsClick = () => {
    if (isGuest) {
      setShowRegistrationPrompt(true);
    } else {
      router.push(`/statistics/${game.id}`);
    }
  };

  if (hasEnded) {
    const timeSpent = formatTimeDelta(
      differenceInSeconds(endTime || now, game.timeStarted)
    );

    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[60vw] max-w-2xl">
        <Card className="p-8">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
            <CardDescription>
              You completed the quiz in {timeSpent}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-center items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{correctAnswers}</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{wrongAnswers}</p>
                <p className="text-sm text-muted-foreground">Wrong</p>
              </div>
            </div>

            <Button 
              onClick={handleStatisticsClick}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isGuest ? "Register to View Statistics" : "View Detailed Statistics"}
            </Button>

            {isGuest && (
              <p className="text-sm text-center text-muted-foreground">
                Create an account to save your results and view detailed statistics
              </p>
            )}
          </CardContent>
        </Card>

        <RegistrationPrompt
          open={showRegistrationPrompt}
          onClose={() => setShowRegistrationPrompt(false)}
          gameId={game.id}
          guestSessionId={game.guestSession?.id}
        />
      </div>
    );
  }

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 md:w-[80vw] max-w-4xl w-[90vw] top-1/2 left-1/2">
      <div className="flex flex-col gap-4">
        <div className="flex flex-row justify-between">
          <div className="flex flex-col">
            <p className="text-slate-400">Topic</p>
            <h1 className="text-2xl font-bold">{game.topic}</h1>
          </div>
          <MCQCounter
            correct_answers={correctAnswers}
            wrong_answers={wrongAnswers}
          />
        </div>

        <Progress
          value={(questionIndex / game.questions.length) * 100}
          className="h-2"
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Question {questionIndex + 1} of {game.questions.length}
              </span>
              <span>{Math.round((questionIndex / game.questions.length) * 100)}% complete</span>
            </CardTitle>
            <CardDescription className="text-lg">
              {currentQuestion?.question}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {questionData.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedChoice === index ? "default" : "outline"}
                className={cn("w-full py-8", selectedChoice === index && "border-2 border-primary")}
                onClick={() => setSelectedChoice(index)}
              >
                {option}
              </Button>
            ))}

            <Button
              className="w-full mt-4"
              onClick={handleNext}
              disabled={isChecking}
            >
              {isChecking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Next Question
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MCQ;
