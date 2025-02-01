import React from "react";

import { getAuthSession } from "@/lib/nextauth";
import { redirect } from "next/navigation";
import QuizCreation from "@/components/forms/QuizCreation";

export const metadata = {
  title: "Quiz | Quizify",
  description: "Quiz yourself on anything!",
};

interface Props {
  searchParams: {
    topic?: string;
    guest?: string;
  };
}

const Quiz = async ({ searchParams }: Props) => {
  const session = await getAuthSession();
  const isGuest = searchParams.guest === 'true';
  
  // Only redirect if not a guest and not logged in
  if (!session?.user && !isGuest) {
    redirect("/");
  }

  return <QuizCreation topic={searchParams.topic ?? ""} isGuest={isGuest} />;
};

export default Quiz;
