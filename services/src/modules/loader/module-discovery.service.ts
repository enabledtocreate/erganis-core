import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { DiscoveredModule, ModuleManifest } from '@erganis/platform';

@Injectable()
export class ModuleDiscoveryService {
  constructor(private readonly config: ConfigService) {}

  async discover(): Promise<DiscoveredModule[]> {
    const roots = this.moduleRoots();
    const discovered: DiscoveredModule[] = [];
    const seen = new Set<string>();

    for (const root of roots) {
      await this.discoverFromRoot(root, discovered, seen);
    }
    return discovered.sort((a, b) => a.manifest.id.localeCompare(b.manifest.id));
  }

  private async discoverFromRoot(
    root: string,
    discovered: DiscoveredModule[],
    seen: Set<string>,
  ): Promise<void> {
    const rootManifestPath = path.join(root, 'erganis.module.json');
    if (await this.tryAddModule(root, rootManifestPath, discovered, seen)) {
      return;
    }

    let entries: string[];
    try {
      entries = await readdir(root);
    } catch {
      return;
    }

    for (const entry of entries) {
      const moduleDir = path.join(root, entry);
      const manifestPath = path.join(moduleDir, 'erganis.module.json');
      await this.tryAddModule(moduleDir, manifestPath, discovered, seen);
    }
  }

  private async tryAddModule(
    moduleDir: string,
    manifestPath: string,
    discovered: DiscoveredModule[],
    seen: Set<string>,
  ): Promise<boolean> {
    try {
      const raw = await readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(raw) as ModuleManifest;
      this.validateManifest(manifest);
      if (seen.has(manifest.id)) {
        return true;
      }
      seen.add(manifest.id);
      discovered.push({
        manifest,
        rootDir: path.resolve(moduleDir),
        manifestPath: path.resolve(manifestPath),
      });
      return true;
    } catch {
      return false;
    }
  }

  moduleRoots(): string[] {
    const roots = new Set<string>();
    const main = this.config.get<string>('modulesRoot', '');
    if (main) {
      roots.add(path.resolve(main));
    }
    for (const extra of this.config.get<string[]>('modulesExtraRoots', []) ?? []) {
      if (extra) {
        roots.add(path.resolve(extra));
      }
    }
    return [...roots];
  }

  modulesRoot(): string {
    const [first] = this.moduleRoots();
    return first ?? '';
  }

  private validateManifest(manifest: ModuleManifest): void {
    if (!manifest.id || !manifest.version || !manifest.entryPoint) {
      throw new Error('Invalid module manifest: missing id, version, or entryPoint');
    }
  }
}
