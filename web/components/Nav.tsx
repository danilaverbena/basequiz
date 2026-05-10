'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/',        label: 'Home',    d: 'M3 12l9-9 9 9v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z' },
  { href: '/quiz',    label: 'Quiz',    d: 'M9 9h6M9 13h6M9 17h4' }, // with circle
  { href: '/ranks',   label: 'Ranks',   d: 'M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.6 5.7 21l2.3-7.2-6-4.4h7.6z' },
  { href: '/profile', label: 'Profile', d: '' },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-bg/95 backdrop-blur-md">
      <div className="mx-auto max-w-md flex justify-around items-center pt-3 pb-7 px-6">
        {items.map(({ href, label, d }) => {
          const active = href === '/' ? path === '/' : path?.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 ${active ? 'text-primary' : 'text-text-3'}`}>
              {label === 'Quiz' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 9h6M9 13h6M9 17h4" />
                </svg>
              ) : label === 'Profile' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
                  <path d={d} />
                </svg>
              )}
              <span className="text-[10px] font-semibold tracking-wider">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
