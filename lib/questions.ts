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

/**
 * gal 题库每道题的抽题权重。普通题库每题权重 1。
 * 取 0.2 时，每次抽 10 题平均约为 9 道普通题 + 1 道 gal 题。
 */
const GAL_WEIGHT = 0.2;

export function questionWeight(q: Question): number {
  return q.category === "gal" ? GAL_WEIGHT : 1;
}

/**
 * 按权重不放回抽题：每道题被抽中的概率与其权重成正比，
 * 也就是「普通题库每题权重 1，gal 题库每题权重 0.5」。
 */
export async function getRandomQuestions(count = 10): Promise<Question[]> {
  const all = await getQuestions();
  const pool = all.map((q) => ({ q, weight: questionWeight(q) }));
  const picked: Question[] = [];
  const target = Math.min(count, pool.length);

  while (picked.length < target && pool.length > 0) {
    const total = pool.reduce((sum, item) => sum + item.weight, 0);
    let r = Math.random() * total;
    let index = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r <= 0) {
        index = i;
        break;
      }
    }
    picked.push(pool[index].q);
    pool.splice(index, 1);
  }

  return picked;
}
