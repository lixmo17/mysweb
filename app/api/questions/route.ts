import { NextResponse } from "next/server";
import { getRandomQuestions } from "@/lib/questions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countParam = Number(searchParams.get("count"));
  const count = Number.isFinite(countParam) && countParam > 0 ? countParam : 10;

  const questions = await getRandomQuestions(count);

  const safeQuestions = questions.map((q) => ({
    id: q.id,
    type: q.type,
    question: q.question,
    options: q.options,
    optionImages: q.optionImages,
    images: q.images,
    hint: q.hint,
    category: q.category,
  }));

  return NextResponse.json({ questions: safeQuestions });
}
