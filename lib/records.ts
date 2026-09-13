import { promises as fs } from "fs";
import path from "path";
import type {
  QuestionRecord,
  QuestionType,
  RecordsFile,
  StatItem,
} from "./types";
import { getQuestions } from "./questions";

const DATA_DIR = path.join(process.cwd(), "data");
const RECORDS_PATH = path.join(DATA_DIR, "records.json");
const EXPORT_PATH = path.join(process.cwd(), "正确率统计.txt");

export async function getRecords(): Promise<Record<string, QuestionRecord>> {
  try {
    const raw = await fs.readFile(RECORDS_PATH, "utf-8");
    const data = JSON.parse(raw) as RecordsFile;
    return data.records ?? {};
  } catch {
    return {};
  }
}

export async function saveRecords(
  records: Record<string, QuestionRecord>
): Promise<void> {
  const data: RecordsFile = { records };
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(RECORDS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function recordAnswers(
  results: { id: number; isCorrect: boolean }[]
): Promise<void> {
  const questions = await getQuestions();
  const excluded = new Set(
    questions
      .filter((q) => q.countInStats === false || q.answer.trim() === "")
      .map((q) => q.id)
  );

  const records = await getRecords();
  for (const r of results) {
    if (excluded.has(r.id)) continue;
    const key = String(r.id);
    const current = records[key] ?? { correct: 0, total: 0 };
    records[key] = {
      correct: current.correct + (r.isCorrect ? 1 : 0),
      total: current.total + 1,
    };
  }
  await saveRecords(records);
  await exportStatsToFile();
}

export async function getStats(): Promise<StatItem[]> {
  const [questions, records] = await Promise.all([getQuestions(), getRecords()]);
  return questions
    .filter((q) => q.countInStats !== false)
    .map((q) => {
      const rec = records[String(q.id)] ?? { correct: 0, total: 0 };
      const rate = rec.total > 0 ? rec.correct / rec.total : 0;
      return {
        id: q.id,
        question: q.question,
        type: q.type,
        category: q.category,
        correct: rec.correct,
        total: rec.total,
        rate,
      };
    });
}

/** 不参与正确率统计的题目（答案待补充、特殊题型等） */
export async function getExcludedQuestions(): Promise<
  { id: number; question: string; type: QuestionType }[]
> {
  const questions = await getQuestions();
  return questions
    .filter((q) => q.countInStats === false || q.answer.trim() === "")
    .map((q) => ({ id: q.id, question: q.question, type: q.type }));
}

export async function exportStatsToFile(): Promise<string> {
  const stats = await getStats();
  const excluded = await getExcludedQuestions();

  const totalAttempts = stats.reduce((sum, s) => sum + s.total, 0);
  const attempted = stats.filter((s) => s.total > 0);
  const avg =
    attempted.length > 0
      ? attempted.reduce((sum, s) => sum + s.rate, 0) / attempted.length
      : 0;

  const now = new Date().toLocaleString("zh-CN", { hour12: false });

  const lines: string[] = [];
  lines.push("正确率统计");
  lines.push(`生成时间：${now}`);
  lines.push(`统计题数：${stats.length}`);
  if (excluded.length > 0) {
    lines.push(
      `未计入统计：${excluded.map((q) => `第 ${q.id} 题`).join("、")}`
    );
  }
  lines.push(`累计答题次数：${totalAttempts}`);
  lines.push(`整体平均正确率：${(avg * 100).toFixed(1)}%`);
  lines.push("");
  lines.push(
    ["题号", "分类", "答对次数", "总次数", "正确率", "题目"].join("\t")
  );
  for (const s of stats) {
    lines.push(
      [
        s.id,
        s.category,
        s.correct,
        s.total,
        `${(s.rate * 100).toFixed(1)}%`,
        s.question.replace(/\s+/g, " "),
      ].join("\t")
    );
  }

  await fs.writeFile(EXPORT_PATH, "\uFEFF" + lines.join("\r\n"), "utf-8");
  return EXPORT_PATH;
}
