import { http, createConfig, createStorage, cookieStorage } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

/**
 * Use Coinbase Wallet connector with smart-wallet preference — under the hood
 * this is Base Account (the Coinbase smart wallet brand).
 * Add a generic `injected` fallback for MetaMask / browser extensions.
 */
export const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName:    'BaseQuiz',
      preference: 'smartWalletOnly',
    }),
    injected(),
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
