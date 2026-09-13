import { NextResponse } from "next/server";
import { getQuestions } from "@/lib/questions";
import { isAnswerCorrect } from "@/lib/grade";

export const dynamic = "force-dynamic";

interface CheckBody {
  id?: number;
  answer?: string;
}

/**
 * 单题判分：选择题在作答后立刻调用，用于当场显示对错。
 * 这里只做判定，不写入正确率统计；统计统一在交卷时记录。
 */
export async function POST(request: Request) {
  let body: CheckBody;
  try {
    body = (await request.json()) as CheckBody;
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const id = Number(body.id);
  const answer = typeof body.answer === "string" ? body.answer : "";

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "缺少题目 id" }, { status: 400 });
  }

  const questions = await getQuestions();
  const question = questions.find((q) => q.id === id);

  if (!question) {
    return NextResponse.json({ error: "题目不存在" }, { status: 404 });
  }

  const hasKey = question.answer.trim() !== "";

  return NextResponse.json({
    id: question.id,
    type: question.type,
    hasKey,
    isCorrect: hasKey ? isAnswerCorrect(question, answer) : false,
    correctAnswer: hasKey ? question.answer : "",
  });
}
