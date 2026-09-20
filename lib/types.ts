export type QuestionType = "choice" | "fill";

export interface Question {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[];
  /** 与 options 一一对应的选项配图，只有图片选项的题目可以不给 options */
  optionImages?: string[];
  /** 题干配图 */
  images?: string[];
  /** 需要点击「提示」按钮才显示的提示内容 */
  hint?: string;
  answer: string;
  category: string;
  countInStats?: boolean;
}

export interface QuestionsFile {
  questions: Question[];
}

export interface QuestionRecord {
  correct: number;
  total: number;
}

export interface RecordsFile {
  records: Record<string, QuestionRecord>;
}

export interface StatItem {
  id: number;
  question: string;
  type: QuestionType;
  category: string;
  correct: number;
  total: number;
  rate: number;
}

export interface AnswerResult {
  id: number;
  question: string;
  type: QuestionType;
  category: string;
  options?: string[];
  optionImages?: string[];
  images?: string[];
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  /** true 表示题库里还没有标准答案，本题不计分也不计入正确率 */
  noKey: boolean;
  counted: boolean;
  correct: number;
  total: number;
  rate: number;
}
