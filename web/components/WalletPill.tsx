'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

function trim(addr?: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
}

export function WalletPill() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (!isConnected) {
    const baseAcct = connectors.find((c) => c.id === 'coinbaseWalletSDK') ?? connectors[0];
    return (
      <button
        onClick={() => baseAcct && connect({ connector: baseAcct })}
        disabled={isPending}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-white font-semibold text-xs shadow-[0_4px_10px_-2px_rgba(0,82,255,0.40)] disabled:opacity-60"
      >
        {isPending ? 'Connecting…' : 'Continue with Base'}
      </button>
    );
  }

  return (
    <button
      onClick={() => disconnect()}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-text-2 font-medium text-xs shadow-[0_2px_4px_rgba(40,30,60,0.04)]"
    >
      <span aria-hidden className="w-2 h-2 rounded-full bg-mint" style={{ boxShadow: '0 0 0 3px rgba(91,199,157,0.18)' }} />
      {trim(address)}
    </button>
  );
}
