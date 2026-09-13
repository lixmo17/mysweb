import { promises as fs } from "fs";
import path from "path";
import type { Question, QuestionsFile } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const QUESTIONS_PATH = path.join(DATA_DIR, "questions.json");

export async function getQuestions(): Promise<Question[]> {
  const raw = await fs.readFile(QUESTIONS_PATH, "utf-8");
  const data = JSON.parse(raw) as QuestionsFile;
  return data.questions;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function getRandomQuestions(count = 10): Promise<Question[]> {
  const all = await getQuestions();
  const shuffled = shuffle(all);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
