import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Example Tests', () => {
  it('should pass a simple unit test', () => {
    expect(1 + 1).toBe(2);
  });

  it('Property: addition is commutative', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      }),
      { numRuns: 50 }
    );
  });
});
