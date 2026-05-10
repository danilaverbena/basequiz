/**
 * GET /api/question?address=0x...&id=42
 *   Returns a public-safe question (correct stripped).
 *   If `id` omitted → server picks a random unsolved + unlocked question for the user.
 *
 * The server hits the BaseQuiz contract to filter out solved + locked questions.
 */
import { NextRequest, NextResponse } from 'next/server';
import { questions, publicView, getQuestion } from '@/lib/questions';
import { publicRpc } from '@/lib/server-rpc';
import { QUIZ_ADDRESS, QUIZ_ABI } from '@/lib/contract';
import { isAddress } from 'viem';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const address = url.searchParams.get('address');
  const idParam = url.searchParams.get('id');

  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: 'address required (0x…)' }, { status: 400 });
  }
  const user = address as `0x${string}`;

  if (idParam) {
    const id = Number(idParam);
    const q = getQuestion(id);
    if (!q) return NextResponse.json({ error: 'unknown question' }, { status: 404 });
    return NextResponse.json({ question: publicView(q) });
  }

  // Pick a random question that's not solved and not currently locked for this user.
  // Multicall against the contract for all 100 questionIds in one RPC roundtrip.
  const ids = questions.map((q) => q.id);
  const solvedCalls = ids.map((id) => ({
    address:      QUIZ_ADDRESS,
    abi:          QUIZ_ABI,
    functionName: 'solved' as const,
    args:         [user, id] as const,
  }));
  const lockoutCalls = ids.map((id) => ({
    address:      QUIZ_ADDRESS,
    abi:          QUIZ_ABI,
    functionName: 'lockoutUntil' as const,
    args:         [user, id] as const,
  }));

  const [solvedResults, lockoutResults] = await Promise.all([
    publicRpc.multicall({ contracts: solvedCalls,  allowFailure: true }),
    publicRpc.multicall({ contracts: lockoutCalls, allowFailure: true }),
  ]);

  const now = Math.floor(Date.now() / 1000);
  const available = ids.filter((id, i) => {
    const solved = solvedResults[i]?.result === true;
    const lockedUntil = Number(lockoutResults[i]?.result ?? 0);
    return !solved && lockedUntil <= now;
  });

  if (available.length === 0) {
    return NextResponse.json({ question: null, message: 'All questions solved or temporarily locked.' });
  }

  const pickedId = available[Math.floor(Math.random() * available.length)];
  const q = getQuestion(pickedId)!;
  return NextResponse.json({ question: publicView(q), remaining: available.length });
}
