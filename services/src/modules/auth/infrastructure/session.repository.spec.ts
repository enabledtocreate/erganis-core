import { SessionRepository } from './session.repository';

describe('SessionRepository', () => {
  it('hashes tokens deterministically', () => {
    const a = SessionRepository.hashToken('abc');
    const b = SessionRepository.hashToken('abc');
    expect(a).toBe(b);
    expect(a).not.toBe('abc');
  });

  it('generates unique tokens', () => {
    const a = SessionRepository.generateToken();
    const b = SessionRepository.generateToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(10);
  });

  it('creates session via pool', async () => {
    const query = jest.fn().mockResolvedValue({
      rows: [
        {
          id: 's1',
          user_id: 'u1',
          token_hash: 'hash',
          expires_at: new Date(),
        },
      ],
      rowCount: 1,
    });
    const repo = new SessionRepository({ query } as never);
    const created = await repo.createSession('u1', new Date(Date.now() + 60_000));
    expect(created.token).toBeDefined();
    expect(query).toHaveBeenCalled();
  });

  it('finds valid session by token hash', async () => {
    const token = 'test-token';
    const query = jest.fn().mockResolvedValue({
      rows: [
        {
          id: 's1',
          user_id: 'u1',
          token_hash: SessionRepository.hashToken(token),
          expires_at: new Date(Date.now() + 60_000),
        },
      ],
      rowCount: 1,
    });
    const repo = new SessionRepository({ query } as never);
    const found = await repo.findValidSession(token);
    expect(found?.userId).toBe('u1');
  });
});
