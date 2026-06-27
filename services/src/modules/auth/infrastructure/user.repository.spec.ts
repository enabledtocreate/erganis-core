import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  it('finds user by email case-insensitively', async () => {
    const query = jest.fn().mockResolvedValue({
      rowCount: 1,
      rows: [
        {
          id: 'u1',
          public_id: 'user_abc',
          email: 'admin@acme.com',
          password_hash: 'hash',
          display_name: 'Admin',
        },
      ],
    });
    const repo = new UserRepository({ query } as never);
    const user = await repo.findByEmail('Admin@Acme.com');
    expect(user?.email).toBe('admin@acme.com');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('lower(email)'), [
      'Admin@Acme.com',
    ]);
  });

  it('creates user with generated public id', async () => {
    const query = jest.fn().mockResolvedValue({
      rowCount: 1,
      rows: [
        {
          id: 'u1',
          public_id: 'user_test',
          email: 'new@acme.com',
          password_hash: null,
          display_name: null,
        },
      ],
    });
    const repo = new UserRepository({ query } as never);
    const user = await repo.createUser({
      email: 'new@acme.com',
      publicId: 'user_test',
    });
    expect(user.publicId).toBe('user_test');
  });
});
