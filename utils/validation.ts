// ── Input validation helpers ──

import type { ImpersonateMethod } from '@/types';

export function validateEmail(email: string): boolean {
  return /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i.test(
    email
  );
}

export function detectImpersonateMethod(
  input: string
): { method: ImpersonateMethod; value: string } | { error: string } {
  if (input.includes('@')) {
    return validateEmail(input)
      ? { method: 'email', value: input }
      : { error: 'Invalid email address format.' };
  }
  if (/^\d+$/.test(input)) return { method: 'zuid', value: input };
  return { method: 'screenname', value: input };
}
