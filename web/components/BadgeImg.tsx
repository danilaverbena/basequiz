'use client';

import Image from 'next/image';
import { badgeFor } from '@/lib/badges';

export function BadgeImg({
  level,
  size = 120,
  className = '',
}: {
  level: number;
  size?: number;
  className?: string;
}) {
  const b = badgeFor(level);
  return (
    <Image
      src={b.src}
      alt={`Level ${level} — ${b.name}`}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      priority={size >= 100}
    />
  );
}
