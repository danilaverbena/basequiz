/**
 * GET /api/profile/:address
 *   Returns onchain user state + counts of solved / locked.
 */
import { NextRequest, NextResponse } from 'next/server';
import { publicRpc } from '@/lib/server-rpc';
import { QUIZ_ADDRESS, QUIZ_ABI } from '@/lib/contract';
import { questions } from '@/lib/questions';
import { isAddress } from 'viem';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: { address: string } }) {
  const address = ctx.params.address;
  if (!isAddress(address)) {
    return NextResponse.json({ error: 'bad address' }, { status: 400 });
  }
  const user = address as `0x${string}`;

  const ids = questions.map((q) => q.id);

  const [state, solvedResults, lockoutResults] = await Promise.all([
    publicRpc.readContract({
      address: QUIZ_ADDRESS, abi: QUIZ_ABI,
      functionName: 'getUserState', args: [user],
    }),
    publicRpc.multicall({
      contracts: ids.map((id) => ({
        address: QUIZ_ADDRESS, abi: QUIZ_ABI,
        functionName: 'solved' as const, args: [user, id] as const,
      })),
      allowFailure: true,
    }),
    publicRpc.multicall({
      contracts: ids.map((id) => ({
        address: QUIZ_ADDRESS, abi: QUIZ_ABI,
        functionName: 'lockoutUntil' as const, args: [user, id] as const,
      })),
      allowFailure: true,
    }),
  ]);

  const now = Math.floor(Date.now() / 1000);
  const solvedIds  = ids.filter((_, i) => solvedResults[i]?.result === true);
  const lockedIds  = ids.filter((_, i) => Number(lockoutResults[i]?.result ?? 0) > now);

  return NextResponse.json({
    user,
    state: {
      currentStreak:  Number((state as any).currentStreak),
      currentLevel:   Number((state as any).currentLevel),
      totalCorrect:   Number((state as any).totalCorrect),
      totalAnswered:  Number((state as any).totalAnswered),
      lastActiveAt:   Number((state as any).lastActiveAt),
    },
    solvedIds,
    lockedIds,
  });
}
