import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export interface StoredFile {
  fileId: string;
  orgId: string;
  relativePath: string;
  sizeBytes: number;
  contentType: string;
}

@Injectable()
export class LocalFileStoreService {
  constructor(private readonly config: ConfigService) {}

  private root(): string {
    const root = this.config.get<string>('dataRoot', '');
    if (!root) {
      throw new Error('ERGANIS_DATA_ROOT is required for FileStore');
    }
    return path.resolve(root);
  }

  async store(input: {
    orgId: string;
    namespace: string;
    fileName: string;
    contentType: string;
    data: Buffer;
  }): Promise<StoredFile> {
    const fileId = randomUUID();
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const relativePath = path.join(input.orgId, input.namespace, `${fileId}_${safeName}`);
    const absolutePath = path.join(this.root(), relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.data);
    return {
      fileId,
      orgId: input.orgId,
      relativePath: relativePath.replace(/\\/g, '/'),
      sizeBytes: input.data.length,
      contentType: input.contentType,
    };
  }

  async read(orgId: string, relativePath: string): Promise<Buffer> {
    const normalized = relativePath.replace(/\\/g, '/');
    if (normalized.includes('..') || !normalized.startsWith(`${orgId}/`)) {
      throw new Error('Invalid file path');
    }
    return readFile(path.join(this.root(), normalized));
  }
}
