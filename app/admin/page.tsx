"use client";

import { useEffect, useMemo, useState } from "react";

interface StatItem {
  id: number;
  question: string;
  type: "choice" | "fill";
  category: string;
  correct: number;
  total: number;
  rate: number;
}

interface ExcludedItem {
  id: number;
  question: string;
  type: "choice" | "fill";
}

export default function AdminPage() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [excluded, setExcluded] = useState<ExcludedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [exportMsg, setExportMsg] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stats", { cache: "no-store" });
      if (!res.ok) throw new Error("加载统计失败");
      const data = (await res.json()) as {
        stats: StatItem[];
        excluded: ExcludedItem[];
      };
      setStats(data.stats);
      setExcluded(data.excluded ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleExport() {
    setExportMsg("");
    try {
      const res = await fetch("/api/export", { method: "POST" });
      if (!res.ok) throw new Error("导出失败");
      const data = (await res.json()) as { path: string };
      setExportMsg(`已导出到：${data.path}`);
    } catch (e) {
      setExportMsg(e instanceof Error ? e.message : "导出失败");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...stats];
    copy.sort((a, b) => {
      const diff = b.rate - a.rate;
      return sortDesc ? diff : -diff;
    });
    return copy;
  }, [stats, sortDesc]);

  const summary = useMemo(() => {
    const totalAttempts = stats.reduce((sum, s) => sum + s.total, 0);
    const attempted = stats.filter((s) => s.total > 0);
    const avg =
      attempted.length > 0
        ? attempted.reduce((sum, s) => sum + s.rate, 0) / attempted.length
        : 0;
    return { totalAttempts, attemptedCount: attempted.length, avg };
  }, [stats]);

  if (loading) {
    return <p className="text-center text-slate-500">加载统计中…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">题目正确率统计</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            导出正确率统计
          </button>
          <button
            type="button"
            onClick={load}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            刷新
          </button>
        </div>
      </div>

      {exportMsg && (
        <p className="rounded-lg bg-indigo-50 px-4 py-2 text-sm text-indigo-700">
          {exportMsg}
        </p>
      )}

      <p className="text-sm text-slate-400">
        注：选择题答对/答错都会实时记录，正确率 = 答对次数 ÷ 被作答次数。
      </p>

      {excluded.length > 0 && (
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
          以下题目暂未录入标准答案，不计入正确率统计：第{" "}
          {excluded.map((q) => q.id).join("、")} 题
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">题目总数</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {stats.length + excluded.length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">累计答题次数</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {summary.totalAttempts}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">整体平均正确率</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">
            {(summary.avg * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">题目</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 text-center font-medium">答对/总次数</th>
              <th className="px-4 py-3 font-medium">
                <button
                  type="button"
                  onClick={() => setSortDesc((v) => !v)}
                  className="inline-flex items-center gap-1 hover:text-indigo-600"
                >
                  正确率 {sortDesc ? "↓" : "↑"}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-400">{s.id}</td>
                <td className="max-w-xs px-4 py-3 text-slate-700">
                  <span className="line-clamp-2">{s.question}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{s.category}</td>
                <td className="px-4 py-3 text-center text-slate-500">
                  {s.correct}/{s.total}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${s.rate * 100}%` }}
                      />
                    </div>
                    <span className="text-slate-600">
                      {(s.rate * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
