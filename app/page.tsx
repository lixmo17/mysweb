import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl bg-white p-10 text-center shadow-sm">
      <h1 className="text-3xl font-bold text-slate-800">在线答题系统</h1>
      <p className="max-w-md text-slate-500">
        每次从题库中随机抽取 10 道题。选择题作答后立即判定对错，
        十道题全部完成后即可查看本次得分。
      </p>
      <Link
        href="/quiz"
        className="rounded-xl bg-indigo-600 px-10 py-4 text-xl font-semibold text-white shadow transition hover:bg-indigo-700"
      >
        开始游戏
      </Link>
      <Link
        href="/admin"
        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 transition hover:border-indigo-300 hover:bg-white hover:text-indigo-600"
      >
        查看题目正确率
      </Link>
    </div>
  );
}
