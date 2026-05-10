'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Logo } from '@/components/Logo';
import { WalletPill } from '@/components/WalletPill';
import { BadgeImg } from '@/components/BadgeImg';
import { StatCard } from '@/components/StatCard';
import { useUserState } from '@/lib/useUserState';
import { badgeFor, BADGES } from '@/lib/badges';

type ProfileResp = {
  user: string;
  state: { currentStreak: number; currentLevel: number; totalCorrect: number; totalAnswered: number; lastActiveAt: number };
  solvedIds: number[];
  lockedIds: number[];
};

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { state } = useUserState(address);
  const [profile, setProfile] = useState<ProfileResp | null>(null);

  useEffect(() => {
    if (!address) return;
    fetch(`/api/profile/${address}`).then((r) => r.json()).then(setProfile).catch(() => {});
  }, [address, state?.currentLevel, state?.totalCorrect]);

  if (!isConnected) {
    return (
      <>
        <header className="flex items-center justify-between pt-2 pb-3">
          <Logo /><WalletPill />
        </header>
        <div className="bg-card border border-border rounded-3xl p-8 text-center mt-8">
          <div className="text-text-2 mb-4">Connect to see your profile.</div>
          <WalletPill />
        </div>
      </>
    );
  }

  const level     = state?.currentLevel ?? 0;
  const streak    = state?.currentStreak ?? 0;
  const correct   = state?.totalCorrect ?? 0;
  const answered  = state?.totalAnswered ?? 0;
  const accuracy  = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const badge     = badgeFor(level);

  const easScanUrl = (uid?: string) =>
    uid ? `https://base.easscan.org/attestation/view/${uid}` : '#';

  return (
    <>
      <header className="flex items-center justify-between pt-2 pb-3">
        <Logo />
        <WalletPill />
      </header>

      <section className="relative overflow-hidden bg-card border border-border rounded-3xl p-5 text-center shadow-[0_4px_20px_-6px_rgba(40,30,60,0.06)]">
        <div className="absolute -top-1/3 -left-1/3 w-[220px] h-[220px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(0,82,255,0.12), transparent 70%)' }} aria-hidden />
        <div className="absolute -bottom-1/3 -right-1/3 w-[220px] h-[220px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(255,142,114,0.16), transparent 70%)' }} aria-hidden />
        <div className="relative z-10">
          <BadgeImg level={level} size={110} className="mx-auto" />
          <div className="font-display font-bold text-[22px] mt-2">{address?.slice(0, 6)}…{address?.slice(-4)}</div>
          <div className="text-text-3 text-[11px] mt-0.5 font-mono">Lvl {level} · {badge.name}</div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <StatCard align="left" variant="blue"   value={`L${level}`} label={badge.name} />
        <StatCard align="left" variant="mint"   value={`${accuracy}%`} label={`Accuracy ${correct}/${answered}`} />
        <StatCard align="left" variant="peach"  value={`🔥 ${streak}`} label="Current streak" />
        <StatCard align="left" variant="yellow" value={`⭐ ${correct}`} label="Total correct" />
      </div>

      <section className="mt-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-semibold text-sm">Achievements · {level}/20</span>
          <span className="text-text-3 text-xs">All levels</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {BADGES.slice(1).map((b) => {
            const locked = b.level > level;
            return (
              <div
                key={b.level}
                className={`relative aspect-square rounded-xl overflow-hidden border border-border bg-card ${locked ? 'opacity-20 grayscale-[0.7]' : ''}`}
                title={`Lvl ${b.level} — ${b.name}`}
              >
                <BadgeImg level={b.level} size={120} className="!rounded-none w-full h-full" />
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center text-base opacity-65">🔒</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-semibold text-sm">EAS Attestations</span>
          <a
            className="text-primary font-semibold text-xs"
            href={`https://base.easscan.org/address/${address}`}
            target="_blank" rel="noopener noreferrer"
          >View on EAS →</a>
        </div>

        {level === 0 && (
          <div className="bg-card border border-border rounded-2xl p-4 text-text-2 text-sm">
            No level-ups yet. Reach Level 1 to earn your first onchain attestation.
          </div>
        )}

        {level > 0 && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: Math.min(level, 5) }, (_, i) => level - i).reverse().map((lvl) => (
              <div key={lvl} className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl shadow-[0_2px_8px_-3px_rgba(40,30,60,0.04)]">
                <div className="w-[34px] h-[34px] rounded-[10px] bg-mint-soft text-mint flex items-center justify-center font-bold">✓</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[13px]">Level {lvl} · {badgeFor(lvl).name}</div>
                  <div className="text-text-3 text-[11px] mt-0.5 font-mono">Attested onchain via EAS</div>
                </div>
                <a
                  className="text-primary font-bold text-[11px]"
                  href={`https://base.easscan.org/address/${address}`}
                  target="_blank" rel="noopener noreferrer"
                >View →</a>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
