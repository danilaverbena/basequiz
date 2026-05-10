'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Logo } from '@/components/Logo';
import { WalletPill } from '@/components/WalletPill';
import { StreakDots } from '@/components/StreakDots';
import { useUserState } from '@/lib/useUserState';
import { QUIZ_ADDRESS, QUIZ_ABI } from '@/lib/contract';

type PublicQuestion = {
  id: number;
  topic: string;
  difficulty: string;
  question: string;
  options: string[];
};

const LETTERS = ['A', 'B', 'C', 'D'];
const TOPIC_LABEL: Record<string, string> = {
  'base-chain':         'Base Chain',
  'base-account':       'Base Account · Smart Wallet',
  'base-app-miniapps':  'Base App · Mini Apps',
  'onchainkit':         'OnchainKit',
  'usdc-base-pay':      'USDC · Base Pay',
  'defi':               'DeFi on Base',
  'farcaster-social':   'Farcaster · Social',
  'tools-security':     'Tools · Security',
};

export default function QuizPage() {
  const { address, isConnected } = useAccount();
  const { state, refetch: refetchState } = useUserState(address);

  const [q, setQ]               = useState<PublicQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase]       = useState<'loading' | 'choosing' | 'signing' | 'pending' | 'result' | 'no-questions'>('loading');
  const [error, setError]       = useState<string | null>(null);
  const [verdict, setVerdict]   = useState<{ correct: boolean } | null>(null);

  const { writeContractAsync, data: txHash } = useWriteContract();
  const { isSuccess: isMined } = useWaitForTransactionReceipt({ hash: txHash });

  // Load a question once the user connects
  useEffect(() => {
    if (!isConnected || !address) return;
    setPhase('loading');
    fetch(`/api/question?address=${address}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.question) {
          setQ(d.question);
          setSelected(null);
          setVerdict(null);
          setPhase('choosing');
        } else {
          setPhase('no-questions');
        }
      })
      .catch((e) => setError(e.message));
  }, [isConnected, address]);

  // When tx mines, refresh state and load next question
  useEffect(() => {
    if (!isMined) return;
    refetchState();
    if (!address) return;
    fetch(`/api/question?address=${address}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.question) {
          setQ(d.question);
          setSelected(null);
          setVerdict(null);
          setPhase('choosing');
        } else {
          setPhase('no-questions');
        }
      });
  }, [isMined, address, refetchState]);

  async function handleSubmit() {
    if (!address || !q || selected === null) return;
    setPhase('signing');
    setError(null);
    try {
      const res = await fetch('/api/sign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ address, questionId: q.id, letter: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const v = data.verdict as {
        user: `0x${string}`; questionId: number; correct: boolean;
        nonce: `0x${string}`; deadline: number; signature: `0x${string}`;
      };
      setVerdict({ correct: v.correct });

      setPhase('pending');
      await writeContractAsync({
        address:      QUIZ_ADDRESS,
        abi:          QUIZ_ABI,
        functionName: 'submitAnswer',
        args: [v.user, v.questionId, v.correct, v.nonce, v.deadline, v.signature],
      });
      setPhase('result');
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || String(e));
      setPhase('choosing');
    }
  }

  if (!isConnected) {
    return (
      <>
        <header className="flex items-center justify-between pt-2 pb-3">
          <Logo />
          <WalletPill />
        </header>
        <div className="bg-card border border-border rounded-3xl p-8 text-center mt-8 shadow-[0_4px_20px_-6px_rgba(40,30,60,0.06)]">
          <div className="text-text-2 mb-4">Connect a Base Account to start the quiz.</div>
          <WalletPill />
        </div>
      </>
    );
  }

  return (
    <>
      <header className="flex items-center justify-between pt-2 pb-3">
        <Logo />
        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-text-2 font-medium text-xs">
          L{state?.currentLevel ?? 0} · 🔥 {state?.currentStreak ?? 0}
        </span>
      </header>

      {phase === 'loading' && <div className="text-center text-text-2 py-12">Loading next question…</div>}

      {phase === 'no-questions' && (
        <div className="bg-card border border-border rounded-3xl p-8 text-center mt-8 shadow-[0_4px_20px_-6px_rgba(40,30,60,0.06)]">
          <div className="text-2xl mb-2">🏆</div>
          <div className="font-display font-bold text-xl mb-2">All caught up</div>
          <div className="text-text-2 text-sm">
            All questions solved or temporarily locked. Locked questions reopen 24 h after a wrong answer.
          </div>
        </div>
      )}

      {q && phase !== 'loading' && phase !== 'no-questions' && (
        <>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-soft border border-[rgba(0,82,255,0.16)] text-primary text-xs font-semibold mt-1">
            ⬡ {TOPIC_LABEL[q.topic] ?? q.topic}
          </span>
          <div className="text-text-3 text-xs mt-3.5 font-medium">
            Question {q.id} of 100 · streak progress {state?.currentStreak ?? 0}/5
          </div>
          <div className="mt-2">
            <StreakDots filled={state?.currentStreak ?? 0} />
          </div>

          <h1 className="font-display font-semibold text-[22px] leading-[1.32] -tracking-tight mt-2 mb-5">
            {q.question}
          </h1>

          <div className="flex flex-col gap-2.5">
            {q.options.map((opt, i) => {
              const isSel = selected === i;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  disabled={phase !== 'choosing'}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-[1.5px] text-left text-sm font-medium leading-[1.35] transition-all ${
                    isSel
                      ? 'bg-primary-softer border-primary'
                      : 'bg-card border-border'
                  } shadow-[0_2px_8px_-3px_rgba(40,30,60,0.04)] disabled:opacity-60`}
                >
                  <span
                    className={`w-[30px] h-[30px] rounded-xl flex items-center justify-center font-display font-bold text-[13px] flex-shrink-0 ${
                      isSel ? 'bg-primary text-white' : 'bg-bg-soft text-text-2 border border-border'
                    }`}
                  >
                    {LETTERS[i]}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4 mb-2.5 px-3.5 py-2.5 bg-bg-soft border border-border-soft rounded-xl text-text-2 text-xs">
            <span>⛽ Estimated gas</span>
            <span className="text-text font-semibold">~$0.0001 · Base Mainnet</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={selected === null || phase === 'signing' || phase === 'pending'}
            className="cta-primary disabled:opacity-60"
          >
            {phase === 'signing' && 'Signing verdict…'}
            {phase === 'pending' && 'Submitting onchain…'}
            {(phase === 'choosing' || phase === 'result') && 'Sign & Submit Answer →'}
          </button>

          {error && <div className="text-red-500 text-xs mt-2 text-center">{error}</div>}

          {phase === 'result' && verdict && (
            <div
              className={`mt-4 p-4 rounded-2xl text-center font-semibold ${
                verdict.correct
                  ? 'bg-mint-soft border border-[rgba(91,199,157,0.30)] text-[#1f7d52]'
                  : 'bg-peach-soft border border-[rgba(255,142,114,0.30)] text-[#a83a25]'
              }`}
            >
              {verdict.correct ? '✓ Correct!' : '✗ Wrong — question locked for 24 h'}
              <div className="text-text-2 text-xs mt-1 font-normal">
                {txHash && (
                  <a
                    className="text-primary underline"
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank" rel="noopener noreferrer"
                  >
                    View on BaseScan →
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
