import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { DiscoveredModule, ModuleManifest } from '@erganis/platform';

@Injectable()
export class ModuleDiscoveryService {
  constructor(private readonly config: ConfigService) {}

  async discover(): Promise<DiscoveredModule[]> {
    const root = this.modulesRoot();
    let entries: string[];
    try {
      entries = await readdir(root);
    } catch {
      return [];
    }

    const discovered: DiscoveredModule[] = [];
    for (const entry of entries) {
      const moduleDir = path.join(root, entry);
      const manifestPath = path.join(moduleDir, 'erganis.module.json');
      try {
        const raw = await readFile(manifestPath, 'utf8');
        const manifest = JSON.parse(raw) as ModuleManifest;
        this.validateManifest(manifest);
        discovered.push({ manifest, rootDir: moduleDir, manifestPath });
      } catch {
        continue;
      }
    }
    return discovered.sort((a, b) => a.manifest.id.localeCompare(b.manifest.id));
  }

  modulesRoot(): string {
    return this.config.get<string>('modulesRoot', '');
  }

  private validateManifest(manifest: ModuleManifest): void {
    if (!manifest.id || !manifest.version || !manifest.entryPoint) {
      throw new Error('Invalid module manifest: missing id, version, or entryPoint');
    }
  }
}
