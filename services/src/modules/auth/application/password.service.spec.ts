import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes and verifies a password', async () => {
    const hash = await service.hash('secret-pass');
    expect(hash).not.toBe('secret-pass');
    expect(await service.verify('secret-pass', hash)).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await service.hash('secret-pass');
    expect(await service.verify('wrong', hash)).toBe(false);
  });

  it('returns false when hash is null', async () => {
    expect(await service.verify('secret-pass', null)).toBe(false);
  });
});
