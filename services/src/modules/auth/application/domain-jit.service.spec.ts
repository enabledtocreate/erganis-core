import { DomainJitService } from './domain-jit.service';

describe('DomainJitService', () => {
  const service = new DomainJitService();

  it('extracts email domain in lowercase', () => {
    expect(service.emailDomain('User@Acme.COM')).toBe('acme.com');
  });

  it('throws for invalid email', () => {
    expect(() => service.emailDomain('not-an-email')).toThrow('Invalid email address');
  });

  it('returns false when allowed domains is empty', () => {
    expect(service.isDomainAllowed('user@acme.com', [])).toBe(false);
  });

  it('matches allowed domain case-insensitively', () => {
    expect(service.isDomainAllowed('user@ACME.com', ['acme.com'])).toBe(true);
    expect(service.isDomainAllowed('user@other.com', ['acme.com'])).toBe(false);
  });
});
