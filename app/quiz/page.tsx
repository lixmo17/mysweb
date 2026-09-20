"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface QuizQuestion {
  id: number;
  type: "choice" | "fill";
  question: string;
  options?: string[];
  optionImages?: string[];
  images?: string[];
  hint?: string;
  category: string;
}

interface CheckResult {
  id: number;
  hasKey: boolean;
  isCorrect: boolean;
  correctAnswer: string;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<number, CheckResult>>({});
  const [checking, setChecking] = useState<number | null>(null);
  const [openHints, setOpenHints] = useState<Record<number, boolean>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/questions?count=10", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("加载题目失败");
        const data = (await res.json()) as { questions: QuizQuestion[] };
        if (active) setQuestions(data.questions);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  /** 填空题只展示题目，由现场工作人员判定，不需要作答 */
  const scoredQuestions = useMemo(
    () => questions.filter((q) => q.type === "choice"),
    [questions]
  );

  const answeredCount = useMemo(
    () =>
      scoredQuestions.filter((q) => (answers[q.id] ?? "").trim() !== "")
        .length,
    [scoredQuestions, answers]
  );

  const allAnswered =
    scoredQuestions.length > 0 && answeredCount === scoredQuestions.length;

  const runningScore = useMemo(
    () => Object.values(checked).filter((c) => c.isCorrect).length,
    [checked]
  );

  /** 选择题：选中即锁定，并当场判定对错 */
  async function chooseAnswer(q: QuizQuestion, letter: string) {
    if (checked[q.id] || checking === q.id) return;
    setAnswers((prev) => ({ ...prev, [q.id]: letter }));
    setChecking(q.id);
    setError("");
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: q.id, answer: letter }),
      });
      if (!res.ok) throw new Error("判分失败，请重试");
      const data = (await res.json()) as CheckResult;
      setChecked((prev) => ({ ...prev, [q.id]: data }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "判分失败");
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[q.id];
        return next;
      });
    } finally {
      setChecking(null);
    }
  }

  async function handleSubmit() {
    if (!allAnswered) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        answers: questions.map((q) => ({
          id: q.id,
          answer: answers[q.id] ?? "",
        })),
      };
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("提交失败，请重试");
      const data = await res.json();
      sessionStorage.setItem("quizResult", JSON.stringify(data));
      router.push("/result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-center text-slate-500">正在抽取题目…</p>;
  }

  if (error && questions.length === 0) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-slate-500">
        题库为空。
        <Link href="/" className="ml-2 text-indigo-600 underline">
          返回首页
        </Link>
      </div>
    );
  }

  const q = questions[current];
  const selected = answers[q.id] ?? "";
  const result = checked[q.id];
  const progress = ((current + 1) / questions.length) * 100;
  const canAdvance = q.type !== "choice" || selected !== "";
  const optionCount = q.options?.length ?? q.optionImages?.length ?? 0;
  const hasImageOptions = !!q.optionImages && q.optionImages.length > 0;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
          <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-600">
            第 {current + 1} 题 / 共 {questions.length} 题
          </span>
          <span>
            已作答 {answeredCount}/{scoredQuestions.length}
            {runningScore > 0 && ` · 已答对 ${runningScore}`}
          </span>
        </div>

        <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mb-1 text-xs text-slate-400">
          {q.category} · {q.type === "choice" ? "选择题" : "现场题"}
        </div>
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="flex-1 text-lg font-semibold leading-relaxed text-slate-800">
            {current + 1}. {q.question}
          </h2>
          {q.hint && (
            <button
              type="button"
              onClick={() =>
                setOpenHints((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
              }
              className={`shrink-0 rounded-lg border px-3 py-1 text-sm font-medium transition ${
                openHints[q.id]
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-slate-300 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-700"
              }`}
            >
              {openHints[q.id] ? "收起提示" : "提示"}
            </button>
          )}
        </div>

        {q.hint && openHints[q.id] && (
          <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="font-semibold">提示：</span>
            {q.hint}
          </div>
        )}

        {q.images && q.images.length > 0 && (
          <div
            className={`mb-5 grid gap-3 ${
              q.images.length >= 4
                ? "grid-cols-2 sm:grid-cols-3"
                : "grid-cols-2"
            }`}
          >
            {q.images.map((src, idx) => (
              <figure key={src} className="space-y-1">
                {q.images!.length > 1 && (
                  <figcaption className="text-xs font-medium text-slate-400">
                    {idx + 1}
                  </figcaption>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`第 ${idx + 1} 张配图`}
                  className="h-40 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
                />
              </figure>
            ))}
          </div>
        )}

        {q.type === "choice" && optionCount > 0 ? (
          <div className={hasImageOptions ? "grid grid-cols-2 gap-3" : "space-y-3"}>
            {Array.from({ length: optionCount }, (_, idx) => {
              const letter = OPTION_LETTERS[idx];
              const isSelected = selected === letter;
              const isRightAnswer =
                !!result && result.hasKey && result.correctAnswer === letter;
              const isWrongPick = !!result && isSelected && !result.isCorrect;

              let tone =
                "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50";
              let badge = "bg-slate-100 text-slate-600";

              if (result) {
                if (isRightAnswer) {
                  tone = "border-green-500 bg-green-50 text-green-800";
                  badge = "bg-green-600 text-white";
                } else if (isWrongPick) {
                  tone = "border-red-500 bg-red-50 text-red-800";
                  badge = "bg-red-600 text-white";
                } else {
                  tone = "border-slate-200 bg-white text-slate-400";
                  badge = "bg-slate-100 text-slate-400";
                }
              } else if (isSelected) {
                tone = "border-indigo-500 bg-indigo-50 text-indigo-700";
                badge = "bg-indigo-600 text-white";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!!result || checking === q.id}
                  onClick={() => chooseAnswer(q, letter)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition disabled:cursor-default ${tone}`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${badge}`}
                  >
                    {letter}
                  </span>
                  {hasImageOptions ? (
                    <span className="flex-1 space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={q.optionImages![idx]}
                        alt={`选项 ${letter}`}
                        className="h-28 w-full rounded-lg bg-slate-50 object-contain"
                      />
                      {q.options?.[idx] && <span>{q.options[idx]}</span>}
                    </span>
                  ) : (
                    <span className="flex-1">{q.options?.[idx]}</span>
                  )}
                  {isRightAnswer && (
                    <span className="shrink-0 text-sm font-semibold text-green-700">
                      ✓
                    </span>
                  )}
                  {isWrongPick && (
                    <span className="shrink-0 text-sm font-semibold text-red-600">
                      ✗
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-amber-50 px-4 py-4 text-sm text-amber-800">
            <p className="font-medium">本题由现场工作人员判定。</p>
            <p className="mt-1 text-amber-700">
              把答案告诉工作人员即可，本题不计入得分，也不计入正确率统计。
            </p>
          </div>
        )}

        {result && (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
              !result.hasKey
                ? "bg-amber-50 text-amber-700"
                : result.isCorrect
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {!result.hasKey
              ? "这题暂未录入标准答案，不计入本次得分。"
              : result.isCorrect
              ? "回答正确！"
              : `回答错误，正确答案是 ${result.correctAnswer}`}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          上一题
        </button>

        {current < questions.length - 1 ? (
          <button
            type="button"
            onClick={() =>
              setCurrent((c) => Math.min(questions.length - 1, c + 1))
            }
            disabled={!canAdvance}
            className="rounded-xl bg-indigo-600 px-5 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            下一题
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="rounded-xl bg-green-600 px-6 py-2 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "提交中…" : "提交答卷"}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm">
        {questions.map((item, idx) => {
          const isChoice = item.type === "choice";
          const done = (answers[item.id] ?? "").trim() !== "";
          const record = checked[item.id];
          const isCurrent = idx === current;

          let tone = "bg-slate-100 text-slate-500 hover:bg-slate-200";
          if (isCurrent) {
            tone = "bg-indigo-600 text-white";
          } else if (!isChoice) {
            tone = "bg-amber-100 text-amber-700";
          } else if (record) {
            tone = record.isCorrect
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700";
          } else if (done) {
            tone = "bg-green-100 text-green-700";
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrent(idx)}
              className={`h-9 w-9 rounded-lg text-sm font-medium transition ${tone}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {!allAnswered && (
        <p className="text-center text-sm text-slate-400">
          还有 {scoredQuestions.length - answeredCount} 道选择题未作答，
          全部作答后即可提交。
        </p>
      )}
    </div>
  );
}
