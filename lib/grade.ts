import type { Question } from "./types";

export function normalizeChoice(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeFill(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isAnswerCorrect(q: Question, userAnswer: string): boolean {
  if (q.type === "choice") {
    return normalizeChoice(userAnswer) === normalizeChoice(q.answer);
  }
  return normalizeFill(userAnswer) === normalizeFill(q.answer);
}
