/**
 * Mini-app metadata used both by the /.well-known/farcaster.json manifest
 * route and the fc:miniapp / fc:frame meta tags on the root layout.
 */
export const ORIGIN =
  process.env.NEXT_PUBLIC_ORIGIN ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
  'https://basequiz-three.vercel.app';

export const SPLASH_BG = '#FAF6EE';

/**
 * Builder code from base.dev — attributes onchain activity originating from
 * this project to the builder for Builder Rewards.
 * Override via env if needed.
 */
export const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE || 'bc_h6qo32f2';

export const miniapp = {
  version:                '1',
  name:                   'BaseQuiz',
  subtitle:               'Learn Base, level up',
  description:            'Onchain quiz about the Base ecosystem. EAS-attested levels, 100 questions, 20 collectable achievement badges.',
  tagline:                'Learn Base, level up.',
  primaryCategory:        'education',
  tags:                   ['base', 'quiz', 'learn', 'eas', 'onchain', 'education'],
  homeUrl:                ORIGIN,
  iconUrl:                `${ORIGIN}/brand/icon.png`,
  splashImageUrl:         `${ORIGIN}/brand/splash-200.png`,
  splashBackgroundColor:  SPLASH_BG,
  heroImageUrl:           `${ORIGIN}/brand/hero.png`,
  ogTitle:                'BaseQuiz — Learn Base, level up',
  ogDescription:          'Onchain quiz with EAS-attested levels. 100 questions across the Base ecosystem.',
  ogImageUrl:             `${ORIGIN}/brand/hero.png`,
  webhookUrl:             `${ORIGIN}/api/webhook`,
  builderCode:            BUILDER_CODE,
  screenshotUrls: [
    `${ORIGIN}/screenshots/home.png`,
    `${ORIGIN}/screenshots/quiz.png`,
    `${ORIGIN}/screenshots/profile.png`,
    `${ORIGIN}/screenshots/ranks.png`,
  ],
} as const;

/** Serialised `fc:miniapp` embed object — what powers the rich preview card in feeds. */
export const miniappEmbed = {
  version:  '1',
  imageUrl: miniapp.heroImageUrl,
  button: {
    title: 'Launch BaseQuiz',
    action: {
      type:                  'launch_frame' as const,
      url:                   ORIGIN,
      name:                  miniapp.name,
      splashImageUrl:        miniapp.splashImageUrl,
      splashBackgroundColor: SPLASH_BG,
    },
  },
} as const;
