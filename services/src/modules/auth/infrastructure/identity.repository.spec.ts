import { IdentityRepository } from './identity.repository';

describe('IdentityRepository', () => {
  it('finds identity by issuer and subject', async () => {
    const query = jest.fn().mockResolvedValue({
      rowCount: 1,
      rows: [{ user_id: 'u1', issuer: 'https://idp', subject: 'sub-1' }],
    });
    const repo = new IdentityRepository({ query } as never);
    const identity = await repo.findByIssuerSubject('https://idp', 'sub-1');
    expect(identity?.userId).toBe('u1');
  });

  it('links identity with upsert', async () => {
    const query = jest.fn().mockResolvedValue({ rowCount: 1, rows: [] });
    const repo = new IdentityRepository({ query } as never);
    await repo.linkIdentity('u1', 'https://idp', 'sub-1');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('oidc_identities'),
      ['u1', 'https://idp', 'sub-1'],
    );
  });
});
