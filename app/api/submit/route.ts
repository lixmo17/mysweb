import { NextResponse } from "next/server";
import { getQuestions } from "@/lib/questions";
import { getRecords, recordAnswers } from "@/lib/records";
import { isAnswerCorrect } from "@/lib/grade";
import type { AnswerResult } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SubmitBody {
  answers: { id: number; answer: string }[];
}

export async function POST(request: Request) {
  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const answers = Array.isArray(body.answers) ? body.answers : [];
  const questions = await getQuestions();
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const beforeRecords = await getRecords();

  const results: AnswerResult[] = [];
  const toRecord: { id: number; isCorrect: boolean }[] = [];

  for (const item of answers) {
    const q = questionMap.get(item.id);
    if (!q) continue;

    const userAnswer = typeof item.answer === "string" ? item.answer : "";
    const noKey = q.answer.trim() === "";
    const isCorrect = noKey ? false : isAnswerCorrect(q, userAnswer);
    toRecord.push({ id: q.id, isCorrect });

    const counted = !noKey && q.countInStats !== false;
    const prev = beforeRecords[String(q.id)] ?? { correct: 0, total: 0 };
    const total = counted ? prev.total + 1 : prev.total;
    const correct = counted ? prev.correct + (isCorrect ? 1 : 0) : prev.correct;

    results.push({
      id: q.id,
      question: q.question,
      type: q.type,
      category: q.category,
      options: q.options,
      optionImages: q.optionImages,
      images: q.images,
      userAnswer,
      correctAnswer: q.answer,
      isCorrect,
      noKey,
      counted,
      correct,
      total,
      rate: total > 0 ? correct / total : 0,
    });
  }

  await recordAnswers(toRecord);

  const scored = results.filter((r) => !r.noKey);
  const score = scored.filter((r) => r.isCorrect).length;
  return NextResponse.json({ score, total: scored.length, results });
}
