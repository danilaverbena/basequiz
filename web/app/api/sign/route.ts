/**
 * POST /api/sign
 *   body: { address: '0x...', questionId: number, letter: 0|1|2|3 }
 *   returns: AnswerVerdict { user, questionId, correct, nonce, deadline, signature }
 *
 * The server checks correctness off-chain, and also checks the contract
 * for solved + lockout before issuing a verdict (defence-in-depth).
 */
import { NextRequest, NextResponse } from 'next/server';
import { isCorrectAnswer, getQuestion } from '@/lib/questions';
import { signVerdict } from '@/lib/sign';
import { publicRpc } from '@/lib/server-rpc';
import { QUIZ_ADDRESS, QUIZ_ABI } from '@/lib/contract';
import { isAddress } from 'viem';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { address?: string; questionId?: number; letter?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const { address, questionId, letter } = body;

  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: 'address required (0x…)' }, { status: 400 });
  }
  if (typeof questionId !== 'number' || !getQuestion(questionId)) {
    return NextResponse.json({ error: 'unknown questionId' }, { status: 400 });
  }
  if (typeof letter !== 'number' || letter < 0 || letter > 3) {
    return NextResponse.json({ error: 'letter must be 0|1|2|3' }, { status: 400 });
  }

  const user = address as `0x${string}`;

  // Defence-in-depth: check on-chain state before signing
  const [solved, lockoutUntil] = await Promise.all([
    publicRpc.readContract({
      address: QUIZ_ADDRESS, abi: QUIZ_ABI,
      functionName: 'solved', args: [user, questionId],
    }),
    publicRpc.readContract({
      address: QUIZ_ADDRESS, abi: QUIZ_ABI,
      functionName: 'lockoutUntil', args: [user, questionId],
    }),
  ]);

  if (solved) {
    return NextResponse.json({ error: 'question already solved on-chain' }, { status: 409 });
  }
  const now = Math.floor(Date.now() / 1000);
  if (Number(lockoutUntil) > now) {
    return NextResponse.json(
      { error: 'question locked', lockedUntil: Number(lockoutUntil) },
      { status: 423 }
    );
  }

  const correct = isCorrectAnswer(questionId, letter);
  const verdict = await signVerdict({ user, questionId, correct });

  return NextResponse.json({ verdict });
}
