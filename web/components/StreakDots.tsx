export function StreakDots({ filled, total = 5 }: { filled: number; total?: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`w-[11px] h-[11px] rounded-full border ${
            i < filled
              ? 'bg-peach border-peach shadow-[0_0_0_3px_#FFE3D8]'
              : 'bg-bg-soft border-border'
          }`}
        />
      ))}
    </div>
  );
}
