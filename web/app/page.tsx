'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { Logo } from '@/components/Logo';
import { WalletPill } from '@/components/WalletPill';
import { BadgeImg } from '@/components/BadgeImg';
import { StreakDots } from '@/components/StreakDots';
import { StatCard } from '@/components/StatCard';
import { useUserState } from '@/lib/useUserState';
import { badgeFor } from '@/lib/badges';

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { state } = useUserState(address);

  const level     = state?.currentLevel ?? 0;
  const streak    = state?.currentStreak ?? 0;
  const correct   = state?.totalCorrect ?? 0;
  const answered  = state?.totalAnswered ?? 0;
  const accuracy  = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const badge     = badgeFor(level);

  return (
    <>
      <header className="flex items-center justify-between pt-2 pb-3">
        <Logo />
        <WalletPill />
      </header>

      <div className="mb-4">
        <div className="text-text-3 text-[11px] font-medium uppercase tracking-wider">
          {isConnected ? 'Welcome back' : 'Welcome to'}
        </div>
        <div className="font-display font-bold text-2xl mt-0.5">
          {isConnected ? `${address?.slice(0, 6)}…${address?.slice(-4)}` : 'BaseQuiz 👋'}
        </div>
      </div>

      <section className="relative overflow-hidden bg-card border border-border rounded-3xl p-5 pt-6 text-center shadow-[0_4px_20px_-6px_rgba(40,30,60,0.06)]">
        <div className="absolute -top-1/2 -right-1/2 w-[240px] h-[240px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(255,142,114,0.18) 0%, transparent 70%)' }} aria-hidden />
        <div className="absolute -bottom-1/2 -left-1/2 w-[240px] h-[240px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(0,82,255,0.10) 0%, transparent 70%)' }} aria-hidden />

        <div className="relative z-10">
          <BadgeImg level={level} size={150} className="mx-auto mb-1" />
          <div className="text-primary font-display font-semibold text-xs tracking-[0.18em] uppercase">
            Level {level}
          </div>
          <div className="font-display font-bold text-[26px] -tracking-tight mt-0.5">{badge.name}</div>

          <div className="flex items-center justify-center gap-3 mt-3 text-text-2 text-[13px]">
            <span>🔥 Streak</span>
            <StreakDots filled={streak} />
            <span>{streak}/5 to L{level + 1}</span>
          </div>

          <Link href="/quiz" className="block mt-4">
            <button className="cta-primary">Continue Learning →</button>
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <StatCard value={correct}   label="Correct" />
        <StatCard value={`${accuracy}%`} label="Accuracy" />
        <StatCard value={answered}  label="Attempts" />
      </div>

      <section className="mt-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-semibold text-sm">Recent achievements</span>
          <Link href="/profile" className="text-primary font-semibold text-xs">View all →</Link>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 5, 10, 15].map((lvl) => (
            <div key={lvl} className={`aspect-square rounded-2xl bg-card border border-border overflow-hidden ${lvl > level ? 'opacity-25' : ''}`}>
              <BadgeImg level={lvl} size={120} className="!rounded-none w-full h-full" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
