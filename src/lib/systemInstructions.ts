import fs from 'fs';
import path from 'path';

export interface SystemInstructionConfig {
  default: string;
  models?: Record<string, string>;
}

let cached: SystemInstructionConfig | null = null;

function loadConfig(): SystemInstructionConfig {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), 'system-instructions.json');
  const text = fs.readFileSync(filePath, 'utf8');
  cached = JSON.parse(text);
  return cached as SystemInstructionConfig;
}

export function getSystemInstruction(model: string): string {
  const cfg = loadConfig();
  return (cfg.models && cfg.models[model]) || cfg.default;
}
