import { describe, expect, it } from 'vitest';

import { cn } from '../utils/classnames';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    const skip = false as boolean;
    expect(cn('a', skip && 'b', undefined, null, 'c')).toBe('a c');
  });

  it('resolves Tailwind conflicts (later wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-green-500')).toBe('text-green-500');
  });
});
