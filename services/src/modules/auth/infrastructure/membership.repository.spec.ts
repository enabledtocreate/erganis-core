import { MembershipRepository } from './membership.repository';

describe('MembershipRepository', () => {
  it('returns membership with role', async () => {
    const query = jest.fn().mockResolvedValue({
      rowCount: 1,
      rows: [
        {
          id: 'r1',
          org_id: 'o1',
          name: 'admin',
          permissions: ['*'],
          is_admin: true,
        },
      ],
    });
    const repo = new MembershipRepository({ query } as never);
    const membership = await repo.findMembership('o1', 'u1');
    expect(membership?.role.name).toBe('admin');
    expect(membership?.role.isAdmin).toBe(true);
  });

  it('adds membership with upsert', async () => {
    const query = jest.fn().mockResolvedValue({ rowCount: 1, rows: [] });
    const repo = new MembershipRepository({ query } as never);
    await repo.addMembership('o1', 'u1', 'r1');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT'),
      ['o1', 'u1', 'r1'],
    );
  });
});
