"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AnswerResult {
  id: number;
  question: string;
  type: "choice" | "fill";
  category: string;
  options?: string[];
  optionImages?: string[];
  images?: string[];
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  noKey: boolean;
  counted: boolean;
  correct: number;
  total: number;
  rate: number;
}

interface ResultData {
  score: number;
  total: number;
  results: AnswerResult[];
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

function formatAnswer(r: AnswerResult, value: string): string {
  if (!value) return "（未作答）";
  if (r.type === "choice" && r.options) {
    const idx = OPTION_LETTERS.indexOf(value.toUpperCase());
    if (idx >= 0 && r.options[idx]) return `${value}. ${r.options[idx]}`;
  }
  return value;
}

function imageOf(r: AnswerResult, letter: string): string | undefined {
  const idx = OPTION_LETTERS.indexOf(letter.toUpperCase());
  return idx >= 0 ? r.optionImages?.[idx] : undefined;
}

function percent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export default function ResultPage() {
  const [data, setData] = useState<ResultData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("quizResult");
    if (raw) {
      try {
        setData(JSON.parse(raw) as ResultData);
      } catch {
        setData(null);
      }
    }
    setLoaded(true);
  }, []);

  if (!loaded) {
    return <p className="text-center text-slate-500">加载中…</p>;
  }

  if (!data) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="mb-4 text-slate-500">没有找到答题结果。</p>
        <Link
          href="/quiz"
          className="rounded-xl bg-indigo-600 px-6 py-2 font-medium text-white hover:bg-indigo-700"
        >
          去答题
        </Link>
      </div>
    );
  }

  const scorePercent = data.total > 0 ? (data.score / data.total) * 100 : 0;
  const onsiteCount = data.results.filter((r) => r.noKey).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-500">本次得分</p>
        <p className="my-2 text-5xl font-bold text-indigo-600">
          {data.score}
          <span className="text-2xl text-slate-400"> / {data.total}</span>
        </p>
        <p className="text-slate-500">正确率 {scorePercent.toFixed(0)}%</p>
        {onsiteCount > 0 && (
          <p className="mt-2 text-sm text-amber-700">
            另有 {onsiteCount} 道现场题由工作人员判定，不计入得分。
          </p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/quiz"
            className="rounded-xl bg-indigo-600 px-6 py-2 font-medium text-white transition hover:bg-indigo-700"
          >
            再答一次
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-6 py-2 font-medium text-slate-600 transition hover:bg-slate-50"
          >
            返回首页
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {data.results.map((r, idx) => {
          const pickedImage = r.optionImages
            ? imageOf(r, r.userAnswer)
            : undefined;
          const rightImage = r.optionImages
            ? imageOf(r, r.correctAnswer)
            : undefined;

          return (
            <div
              key={r.id}
              className={`rounded-2xl border-l-4 bg-white p-5 shadow-sm ${
                r.noKey
                  ? "border-amber-400"
                  : r.isCorrect
                  ? "border-green-500"
                  : "border-red-500"
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="text-xs text-slate-400">
                  {r.category} · 第 {idx + 1} 题
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold ${
                    r.noKey
                      ? "bg-amber-100 text-amber-700"
                      : r.isCorrect
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {r.noKey ? "现场判定" : r.isCorrect ? "答对" : "答错"}
                </span>
              </div>

              <h3 className="mb-3 font-semibold text-slate-800">{r.question}</h3>

              {r.images && r.images.length > 0 && (
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {r.images.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src}
                      src={src}
                      alt="题目配图"
                      className="h-28 w-full rounded-lg border border-slate-200 bg-slate-50 object-contain"
                    />
                  ))}
                </div>
              )}

              {r.noKey ? (
                <p className="text-sm text-amber-700">
                  本题由现场工作人员判定，不计分、不计入正确率统计。
                </p>
              ) : (
                <div className="space-y-2 text-sm">
                  <p className={r.isCorrect ? "text-green-700" : "text-red-600"}>
                    你的答案：{formatAnswer(r, r.userAnswer)}
                  </p>
                  {pickedImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pickedImage}
                      alt="你的选择"
                      className={`h-24 w-24 rounded-lg border object-cover ${
                        r.isCorrect ? "border-green-400" : "border-red-400"
                      }`}
                    />
                  )}
                  {!r.isCorrect && (
                    <div className="space-y-2">
                      <p className="text-green-700">
                        正确答案：{formatAnswer(r, r.correctAnswer)}
                      </p>
                      {rightImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rightImage}
                          alt="正确答案"
                          className="h-24 w-24 rounded-lg border border-green-400 object-cover"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {r.counted && (
                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>历史正确率</span>
                  <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: percent(r.rate) }}
                    />
                  </div>
                  <span className="font-medium text-slate-600">
                    {percent(r.rate)}
                  </span>
                  <span className="text-slate-400">
                    （{r.correct}/{r.total} 次答对）
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
