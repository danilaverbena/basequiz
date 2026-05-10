export function Logo() {
  return (
    <div className="flex items-center gap-2.5 font-display font-bold text-[18px] -tracking-tight text-text">
      <div
        aria-hidden
        className="w-[26px] h-[26px] bg-primary"
        style={{
          clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
          boxShadow: '0 4px 12px rgba(0, 82, 255, 0.30)',
        }}
      />
      BaseQuiz
    </div>
  );
}
