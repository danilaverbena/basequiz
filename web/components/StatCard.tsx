import { ReactNode } from 'react';

type Variant = 'default' | 'blue' | 'mint' | 'peach' | 'yellow';

const variants: Record<Variant, string> = {
  default: 'bg-card border-border',
  blue:    'bg-primary-soft border-[rgba(0,82,255,0.18)]',
  mint:    'bg-mint-soft   border-[rgba(91,199,157,0.24)]',
  peach:   'bg-peach-soft  border-[rgba(255,142,114,0.24)]',
  yellow:  'bg-yellow-soft border-[rgba(255,199,74,0.30)]',
};

export function StatCard({
  value,
  label,
  variant = 'default',
  align = 'center',
}: {
  value: ReactNode;
  label: ReactNode;
  variant?: Variant;
  align?: 'left' | 'center';
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${variants[variant]} ${
        align === 'left' ? 'text-left' : 'text-center'
      } shadow-[0_2px_10px_-4px_rgba(40,30,60,0.04)]`}
    >
      <div className="font-display font-bold text-xl text-text">{value}</div>
      <div className="text-[10px] text-text-3 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
