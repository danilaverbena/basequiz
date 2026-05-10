'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Logo } from '@/components/Logo';
import { WalletPill } from '@/components/WalletPill';
import { BadgeImg } from '@/components/BadgeImg';
import { badgeFor } from '@/lib/badges';

type Row = { user: `0x${string}`; level: number; totalCorrect: number };

export default function RanksPage() {
  const { address } = useAccount();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'global' | 'weekly' | 'friends'>('global');

  useEffect(() => {
    setLoading(true);
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  function trim(a: string) {
    return `${a.slice(0, 6)}…${a.slice(-4)}`;
  }

  const me = address?.toLowerCase();
  const myRank = rows.findIndex((r) => r.user.toLowerCase() === me);
  const podium = rows.slice(0, 3);
  const list   = rows.slice(3, 100);

  return (
    <>
      <header className="flex items-center justify-between pt-2 pb-3">
        <Logo />
        <WalletPill />
      </header>

      <div className="flex gap-1 mt-1 mb-3.5 bg-bg-soft border border-border-soft p-1 rounded-2xl">
        {(['global', 'weekly', 'friends'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize ${
              tab === t
                ? 'bg-card text-primary shadow-[0_2px_8px_-2px_rgba(40,30,60,0.10)]'
                : 'text-text-2'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <div className="text-center text-text-2 py-12">Loading leaderboard…</div>}
      {!loading && rows.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-text-2">
          No level-ups yet. Be the first!
        </div>
      )}

      {!loading && rows.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 items-end mb-3.5" style={{ gridTemplateColumns: '1fr 1.18fr 1fr' }}>
            {podium[1] && <PodCell rank={2}             row={podium[1]} />}
            {podium[0] && <PodCell rank={1} winner      row={podium[0]} />}
            {podium[2] && <PodCell rank={3}             row={podium[2]} />}
          </div>

          <div className="flex flex-col gap-1.5">
            {list.map((r, i) => {
              const rank = i + 4;
              const isMe = r.user.toLowerCase() === me;
              return <LbRow key={r.user} rank={rank} row={r} isMe={isMe} />;
            })}

            {myRank >= 3 && (
              <div className="mt-3">
                <LbRow rank={myRank + 1} row={rows[myRank]} isMe />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function PodCell({ rank, row, winner }: { rank: number; row: Row; winner?: boolean }) {
  return (
    <div
      className={`text-center p-3 border rounded-2xl ${
        winner
          ? 'border-[rgba(255,199,74,0.5)] bg-gradient-to-b from-[rgba(255,199,74,0.16)] to-transparent'
          : 'border-border bg-card'
      } shadow-[0_4px_14px_-4px_rgba(40,30,60,0.05)]`}
    >
      <div className="mx-auto" style={{ width: winner ? 78 : 64, height: winner ? 78 : 64 }}>
        <BadgeImg level={row.level} size={winner ? 78 : 64} />
      </div>
      <div className={`font-display font-bold text-[16px] mt-1.5 ${winner ? 'text-[#C99100]' : ''}`}>
        {winner ? '🏆 #1' : `#${rank}`}
      </div>
      <div className="text-[12px] font-bold mt-0.5 truncate">{row.user.slice(0, 6)}…{row.user.slice(-4)}</div>
      <div className="text-text-3 text-[10px] mt-0.5 font-medium">L{row.level} · ✓ {row.totalCorrect}</div>
    </div>
  );
}

function LbRow({ rank, row, isMe }: { rank: number; row: Row; isMe?: boolean }) {
  return (
    <div
      className={`grid items-center gap-3 px-3.5 py-2.5 rounded-2xl border ${
        isMe ? 'border-[rgba(0,82,255,0.4)] bg-primary-soft' : 'border-border bg-card'
      }`}
      style={{ gridTemplateColumns: '28px 1fr auto auto' }}
    >
      <span className={`font-display font-bold text-[13px] ${isMe ? 'text-primary' : 'text-text-3'}`}>
        {String(rank).padStart(2, '0')}
      </span>
      <div className="font-bold text-[13px] truncate">
        {row.user.slice(0, 6)}…{row.user.slice(-4)}{isMe && ' · YOU'}
      </div>
      <span className="bg-primary-soft text-primary rounded-lg px-2 py-1 font-display font-bold text-[11px]">L{row.level}</span>
      <span className="text-peach font-bold text-[12px]">✓ {row.totalCorrect}</span>
    </div>
  );
}
