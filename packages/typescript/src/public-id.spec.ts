import { createPublicId, isValidPublicId, parsePublicIdType } from './public-id';

describe('public-id', () => {
  it('createPublicId prefixes type with ulid', () => {
    const id = createPublicId('user');
    expect(id.startsWith('user_')).toBe(true);
    expect(isValidPublicId(id)).toBe(true);
  });

  it('rejects invalid type', () => {
    expect(() => createPublicId('Bad-Type')).toThrow(/Invalid public id type/);
  });

  it('parsePublicIdType returns type segment', () => {
    const id = createPublicId('org');
    expect(parsePublicIdType(id)).toBe('org');
  });

  it('isValidPublicId rejects malformed values', () => {
    expect(isValidPublicId('not-an-id')).toBe(false);
    expect(isValidPublicId('user_bad')).toBe(false);
  });
});
