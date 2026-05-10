import { http, createConfig, createStorage, cookieStorage } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

/**
 * Connector ordering matters for in-app browser UX:
 *   1. `injected()` first — inside Base App's WebView the host injects its
 *      Base Account directly into window.ethereum, so this picks it up
 *      with no popup.
 *   2. `coinbaseWallet({ preference: 'smartWalletOnly' })` second — fallback
 *      for users opening the URL in a regular desktop / mobile browser; opens
 *      Coinbase smart-wallet flow (which is Base Account under the hood).
 */
export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    coinbaseWallet({
      appName:    'BaseQuiz',
      preference: 'smartWalletOnly',
    }),
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
