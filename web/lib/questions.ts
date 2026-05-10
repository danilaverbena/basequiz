/**
 * Server-side helpers for the 100-question pool.
 * NEVER expose `correct` to the client.
 */
import questionsRaw from '@/data/questions.json';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Question = {
  id: number;
  topic: string;
  difficulty: Difficulty;
  question: string;
  options: string[]; // length always 4
  correct: 0 | 1 | 2 | 3; // SERVER-ONLY
  explanation: string;
  source: string;
};

export const questions: Question[] = (questionsRaw as unknown as { questions: Question[] }).questions;

export const TOPICS = (questionsRaw as { topics: Record<string, { label: string; count: number }> }).topics;

export function getQuestion(id: number): Question | undefined {
  return questions.find((q) => q.id === id);
}

/** Public-safe view (correct stripped). */
export function publicView(q: Question) {
  const { correct, explanation, ...rest } = q;
  return rest;
}

export function isCorrectAnswer(questionId: number, letter: number): boolean {
  const q = getQuestion(questionId);
  if (!q) return false;
  return q.correct === letter;
}
