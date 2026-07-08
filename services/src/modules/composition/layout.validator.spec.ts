import { validateLayoutDocument } from './layout.validator';

describe('layout.validator', () => {
  it('accepts valid layout document', () => {
    const errors: string[] = [];
    validateLayoutDocument(
      {
        surfaceId: 'product',
        version: '1.0.0',
        root: { type: 'stack', children: [{ type: 'slot', slotId: 'shell.main' }] },
      },
      'product',
      'test.layout.json',
      errors,
    );
    expect(errors).toHaveLength(0);
  });

  it('rejects missing surfaceId', () => {
    const errors: string[] = [];
    validateLayoutDocument(
      { version: '1.0.0', root: { type: 'stack' } },
      undefined,
      'bad.layout.json',
      errors,
    );
    expect(errors.some((e) => e.includes('surfaceId'))).toBe(true);
  });

  it('rejects surfaceId mismatch', () => {
    const errors: string[] = [];
    validateLayoutDocument(
      { surfaceId: 'other', version: '1.0.0', root: { type: 'stack' } },
      'product',
      'bad.layout.json',
      errors,
    );
    expect(errors.some((e) => e.includes('does not match'))).toBe(true);
  });
});
