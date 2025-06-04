import { getSystemInstruction as getConfigSystemInstruction } from '../../config';

// Legacy interface for backward compatibility
export interface SystemInstructionConfig {
  default: string;
  models?: Record<string, string>;
}

// Get system instruction for a specific model
export function getSystemInstruction(model: string): string {
  return getConfigSystemInstruction(model);
}
