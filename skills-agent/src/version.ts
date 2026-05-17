/**
 * Version info for Skills Agent
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let cachedVersion: string | undefined;

export function getVersion(): string {
  if (cachedVersion) return cachedVersion;
  
  try {
    const pkgPath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    cachedVersion = (pkg.version as string) || '0.0.0';
    return cachedVersion;
  } catch {
    return '0.0.0';
  }
}

export function getVersionInfo(): {
  version: string;
  name: string;
  tools: number;
  skills: number;
  personas: number;
} {
  return {
    version: getVersion(),
    name: '@defrindr/skills-agent',
    tools: 5,
    skills: 22,
    personas: 10,
  };
}
