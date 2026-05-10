/**
 * Server-side EIP-712 signing of AnswerVerdict.
 * The private key MUST equal `trustedSigner` on the deployed BaseQuiz contract.
 */
import { privateKeyToAccount } from 'viem/accounts';
import { keccak256, toBytes } from 'viem';
import { EIP712_DOMAIN, ANSWER_VERDICT_TYPES } from './contract';

function getSignerKey(): `0x${string}` {
  const k = process.env.SIGNER_PRIVATE_KEY;
  if (!k || !k.startsWith('0x') || k.length !== 66) {
    throw new Error('SIGNER_PRIVATE_KEY missing or malformed (expected 0x + 64 hex chars)');
  }
  return k as `0x${string}`;
}

export type Verdict = {
  user:       `0x${string}`;
  questionId: number;
  correct:    boolean;
  nonce:      `0x${string}`;
  deadline:   number;
  signature:  `0x${string}`;
};

export async function signVerdict(args: {
  user:       `0x${string}`;
  questionId: number;
  correct:    boolean;
  ttlSeconds?: number;
}): Promise<Verdict> {
  const acct = privateKeyToAccount(getSignerKey());

  // Random 32-byte nonce
  const nonceBytes = new Uint8Array(32);
  crypto.getRandomValues(nonceBytes);
  const nonce = ('0x' + Array.from(nonceBytes, (b) => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;

  const deadline = Math.floor(Date.now() / 1000) + (args.ttlSeconds ?? 300); // 5 min

  const signature = await acct.signTypedData({
    domain:      EIP712_DOMAIN,
    types:       ANSWER_VERDICT_TYPES,
    primaryType: 'AnswerVerdict',
    message: {
      user:       args.user,
      questionId: args.questionId,
      correct:    args.correct,
      nonce,
      deadline,
    },
  });

  return { user: args.user, questionId: args.questionId, correct: args.correct, nonce, deadline, signature };
}

export function getSignerAddress(): `0x${string}` {
  return privateKeyToAccount(getSignerKey()).address;
}
