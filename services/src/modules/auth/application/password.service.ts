import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verify(password: string, hash: string | null): Promise<boolean> {
    if (!hash) {
      return false;
    }
    return bcrypt.compare(password, hash);
  }
}
