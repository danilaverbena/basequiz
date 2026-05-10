/**
 * BaseQuiz contract address, chain, and minimal ABI used by the frontend + server.
 */
import { base } from 'wagmi/chains';

export const QUIZ_ADDRESS =
  (process.env.NEXT_PUBLIC_QUIZ_CONTRACT as `0x${string}`) ??
  '0xF5B18df0D324C065Dc0759781a3533D6964daD1f';

export const EAS_ADDRESS =
  (process.env.NEXT_PUBLIC_EAS_CONTRACT as `0x${string}`) ??
  '0x4200000000000000000000000000000000000021';

export const LEVEL_SCHEMA_UID =
  (process.env.NEXT_PUBLIC_LEVEL_SCHEMA_UID as `0x${string}`) ??
  '0xacce678f28e25c16f4cf761ab517e34cdcd453a46440f068472b4786b70e70c1';

export const CHAIN = base; // 8453

/** EIP-712 domain matching the deployed contract */
export const EIP712_DOMAIN = {
  name: 'BaseQuiz',
  version: '1',
  chainId: CHAIN.id,
  verifyingContract: QUIZ_ADDRESS,
} as const;

/** EIP-712 types for AnswerVerdict signed by the trusted backend */
export const ANSWER_VERDICT_TYPES = {
  AnswerVerdict: [
    { name: 'user',       type: 'address' },
    { name: 'questionId', type: 'uint16'  },
    { name: 'correct',    type: 'bool'    },
    { name: 'nonce',      type: 'bytes32' },
    { name: 'deadline',   type: 'uint32'  },
  ],
} as const;

/** Minimal ABI used in this app */
export const QUIZ_ABI = [
  // Reads
  {
    type: 'function', name: 'users', stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [
      { name: 'currentStreak',   type: 'uint8'  },
      { name: 'currentLevel',    type: 'uint8'  },
      { name: 'totalCorrect',    type: 'uint32' },
      { name: 'totalAnswered',   type: 'uint32' },
      { name: 'lastActiveAt',    type: 'uint32' },
    ],
  },
  {
    type: 'function', name: 'getUserState', stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{
      name: '', type: 'tuple',
      components: [
        { name: 'currentStreak',  type: 'uint8'  },
        { name: 'currentLevel',   type: 'uint8'  },
        { name: 'totalCorrect',   type: 'uint32' },
        { name: 'totalAnswered',  type: 'uint32' },
        { name: 'lastActiveAt',   type: 'uint32' },
      ],
    }],
  },
  {
    type: 'function', name: 'solved', stateMutability: 'view',
    inputs: [
      { name: '', type: 'address' },
      { name: '', type: 'uint16'  },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function', name: 'lockoutUntil', stateMutability: 'view',
    inputs: [
      { name: '', type: 'address' },
      { name: '', type: 'uint16'  },
    ],
    outputs: [{ name: '', type: 'uint32' }],
  },
  {
    type: 'function', name: 'isLocked', stateMutability: 'view',
    inputs: [
      { name: 'user',       type: 'address' },
      { name: 'questionId', type: 'uint16'  },
    ],
    outputs: [
      { name: 'locked', type: 'bool'   },
      { name: 'until',  type: 'uint32' },
    ],
  },
  {
    type: 'function', name: 'usedNonces', stateMutability: 'view',
    inputs: [{ name: '', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function', name: 'trustedSigner', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function', name: 'MAX_LEVEL', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function', name: 'STREAK_FOR_LEVEL_UP', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint8' }],
  },

  // Writes
  {
    type: 'function', name: 'submitAnswer', stateMutability: 'nonpayable',
    inputs: [
      { name: 'user',       type: 'address' },
      { name: 'questionId', type: 'uint16'  },
      { name: 'correct',    type: 'bool'    },
      { name: 'nonce',      type: 'bytes32' },
      { name: 'deadline',   type: 'uint32'  },
      { name: 'signature',  type: 'bytes'   },
    ],
    outputs: [],
  },

  // Events
  {
    type: 'event', name: 'AnswerSubmitted',
    inputs: [
      { name: 'user',       type: 'address', indexed: true  },
      { name: 'questionId', type: 'uint16',  indexed: true  },
      { name: 'correct',    type: 'bool',    indexed: false },
      { name: 'newStreak',  type: 'uint8',   indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event', name: 'LevelUp',
    inputs: [
      { name: 'user',           type: 'address', indexed: true  },
      { name: 'newLevel',       type: 'uint8',   indexed: false },
      { name: 'totalCorrect',   type: 'uint32',  indexed: false },
      { name: 'attestationUID', type: 'bytes32', indexed: false },
    ],
    anonymous: false,
  },
] as const;
