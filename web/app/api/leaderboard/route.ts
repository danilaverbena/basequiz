/**
 * GET /api/leaderboard
 *   Aggregates LevelUp events from the BaseQuiz contract since deploy.
 *   Returns top-100 sorted by (level desc, totalCorrect desc).
 */
import { NextRequest, NextResponse } from 'next/server';
import { publicRpc } from '@/lib/server-rpc';
import { QUIZ_ADDRESS, QUIZ_ABI } from '@/lib/contract';
import { parseAbiItem } from 'viem';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 60; // seconds

const DEPLOY_BLOCK = 45825708n;

const LEVEL_UP_EVENT = parseAbiItem(
  'event LevelUp(address indexed user, uint8 newLevel, uint32 totalCorrect, bytes32 attestationUID)'
);

export async function GET(_req: NextRequest) {
  // Pull all LevelUp events from deploy block to latest.
  // For a denser project a subgraph or scheduled cron->KV is appropriate; this is fine for MVP.
  const latest = await publicRpc.getBlockNumber();
  const logs = await publicRpc.getLogs({
    address:   QUIZ_ADDRESS,
    event:     LEVEL_UP_EVENT,
    fromBlock: DEPLOY_BLOCK,
    toBlock:   latest,
  });

  // Per user keep their latest level + totalCorrect.
  type Row = { user: `0x${string}`; level: number; totalCorrect: number; lastBlock: bigint };
  const map = new Map<string, Row>();
  for (const log of logs) {
    const args = (log as any).args as { user: `0x${string}`; newLevel: number; totalCorrect: number };
    const prev = map.get(args.user.toLowerCase());
    if (!prev || (log.blockNumber ?? 0n) > prev.lastBlock) {
      map.set(args.user.toLowerCase(), {
        user:         args.user,
        level:        Number(args.newLevel),
        totalCorrect: Number(args.totalCorrect),
        lastBlock:    log.blockNumber ?? 0n,
      });
    }
  }

  const rows = Array.from(map.values()).sort(
    (a, b) => b.level - a.level || b.totalCorrect - a.totalCorrect
  );

  return NextResponse.json({
    asOfBlock: latest.toString(),
    count:     rows.length,
    rows:      rows.slice(0, 100).map((r) => ({
      user:         r.user,
      level:        r.level,
      totalCorrect: r.totalCorrect,
    })),
  });
}
