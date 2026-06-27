import { Injectable } from '@nestjs/common';

@Injectable()
export class DomainJitService {
  emailDomain(email: string): string {
    const at = email.lastIndexOf('@');
    if (at <= 0 || at === email.length - 1) {
      throw new Error('Invalid email address');
    }
    return email.slice(at + 1).toLowerCase();
  }

  isDomainAllowed(email: string, allowedDomains: string[]): boolean {
    if (allowedDomains.length === 0) {
      return false;
    }
    const domain = this.emailDomain(email);
    return allowedDomains.map((d) => d.toLowerCase()).includes(domain);
  }
}
