declare module 'vite' {
  export function loadEnv(
    mode: string,
    envDir: string,
    prefixes?: string | string[]
  ): Record<string, string>;
}
