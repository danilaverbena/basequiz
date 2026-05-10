'use client';

import { useReadContract } from 'wagmi';
import { QUIZ_ADDRESS, QUIZ_ABI } from './contract';

export type UserState = {
  currentStreak:  number;
  currentLevel:   number;
  totalCorrect:   number;
  totalAnswered:  number;
  lastActiveAt:   number;
};

export function useUserState(address?: `0x${string}`) {
  const enabled = !!address;
  const { data, isLoading, refetch } = useReadContract({
    address:      QUIZ_ADDRESS,
    abi:          QUIZ_ABI,
    functionName: 'getUserState',
    args:         enabled ? [address!] : undefined,
    query:        { enabled, refetchInterval: 10_000 },
  });

  if (!data) {
    return { state: undefined, isLoading, refetch };
  }
  const s = data as unknown as UserState;
  const state: UserState = {
    currentStreak:  Number(s.currentStreak),
    currentLevel:   Number(s.currentLevel),
    totalCorrect:   Number(s.totalCorrect),
    totalAnswered:  Number(s.totalAnswered),
    lastActiveAt:   Number(s.lastActiveAt),
  };
  return { state, isLoading, refetch };
}
