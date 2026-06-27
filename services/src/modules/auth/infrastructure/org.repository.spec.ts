import { OrgRepository } from './org.repository';

describe('OrgRepository', () => {
  it('maps org row from findBySlug', async () => {
    const query = jest.fn().mockResolvedValue({
      rowCount: 1,
      rows: [
        {
          id: 'id-1',
          public_id: 'org_abc',
          slug: 'acme',
          name: 'Acme',
          allowed_domains: ['acme.com'],
          auth_mode: 'both',
        },
      ],
    });
    const repo = new OrgRepository({ query } as never);
    const org = await repo.findBySlug('acme');
    expect(org).toEqual({
      id: 'id-1',
      publicId: 'org_abc',
      slug: 'acme',
      name: 'Acme',
      allowedDomains: ['acme.com'],
      authMode: 'both',
    });
  });

  it('returns null when org not found', async () => {
    const query = jest.fn().mockResolvedValue({ rowCount: 0, rows: [] });
    const repo = new OrgRepository({ query } as never);
    await expect(repo.findBySlug('missing')).resolves.toBeNull();
  });

  it('ensureAdminRole returns existing admin role', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: 'r1',
            org_id: 'o1',
            name: 'admin',
            permissions: [],
            is_admin: true,
          },
        ],
      });
    const repo = new OrgRepository({ query } as never);
    const role = await repo.ensureAdminRole('o1');
    expect(role.isAdmin).toBe(true);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
