/** Level metadata: badge image + display name */
export type BadgeMeta = { level: number; name: string; src: string };

export const BADGES: BadgeMeta[] = [
  { level: 0,  name: 'Unranked',       src: '/badges/lvl1.png'  }, // placeholder for L0
  { level: 1,  name: 'Newcomer',       src: '/badges/lvl1.png'  },
  { level: 2,  name: 'Sparked',        src: '/badges/lvl2.png'  },
  { level: 3,  name: 'Triad',          src: '/badges/lvl3.png'  },
  { level: 4,  name: 'Quadrant',       src: '/badges/lvl4.png'  },
  { level: 5,  name: 'Initiate',       src: '/badges/lvl5.png'  },
  { level: 6,  name: 'Lattice',        src: '/badges/lvl6.png'  },
  { level: 7,  name: 'Mechanist',      src: '/badges/lvl7.png'  },
  { level: 8,  name: 'Tessellated',    src: '/badges/lvl8.png'  },
  { level: 9,  name: 'Gemborn',        src: '/badges/lvl9.png'  },
  { level: 10, name: 'Block Builder',  src: '/badges/lvl10.png' },
  { level: 11, name: 'Cogsmith',       src: '/badges/lvl11.png' },
  { level: 12, name: 'Geargrand',      src: '/badges/lvl12.png' },
  { level: 13, name: 'Aegis',          src: '/badges/lvl13.png' },
  { level: 14, name: 'Compass',        src: '/badges/lvl14.png' },
  { level: 15, name: 'Resplendent',    src: '/badges/lvl15.png' },
  { level: 16, name: 'Aurora',         src: '/badges/lvl16.png' },
  { level: 17, name: 'Phoenix',        src: '/badges/lvl17.png' },
  { level: 18, name: 'Stellar',        src: '/badges/lvl18.png' },
  { level: 19, name: 'Heirloom',       src: '/badges/lvl19.png' },
  { level: 20, name: 'Base Maestro',   src: '/badges/lvl20.png' },
];

export function badgeFor(level: number): BadgeMeta {
  return BADGES[Math.max(0, Math.min(20, level))];
}
