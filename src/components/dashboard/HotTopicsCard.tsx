import React, { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";
import dynamic from "next/dynamic";

const WordCloud = dynamic(() => import("../WordCloud"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-[400px]">
      <span className="text-muted-foreground">Loading word cloud...</span>
    </div>
  ),
});

type TopicCount = {
  topic: string;
  count: number;
};

async function getTopics() {
  try {
    const topics = await prisma.topic_count.findMany({
      select: {
        topic: true,
        count: true,
      },
    });
    
    return topics.map((topic: { topic: string; count: number }) => ({
      text: topic.topic,
      value: topic.count,
    }));
  } catch (error) {
    console.error("Error fetching topics:", error);
    return [];
  }
}

export default async function HotTopicsCard() {
  const formattedTopics = await getTopics();

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Hot Topics</CardTitle>
        <CardDescription>
          Click on a topic to start a quiz on it.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <Suspense fallback={
          <div className="flex items-center justify-center w-full h-[400px]">
            <span className="text-muted-foreground">Loading topics...</span>
          </div>
        }>
          {formattedTopics.length > 0 ? (
            <WordCloud formattedTopics={formattedTopics} />
          ) : (
            <div className="flex items-center justify-center w-full h-[400px]">
              <span className="text-muted-foreground">No topics available yet. Create a quiz to get started!</span>
            </div>
          )}
        </Suspense>
      </CardContent>
    </Card>
  );
}
