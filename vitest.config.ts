import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { createRequire } from "module";

let loadEnv: (mode: string, envDir: string) => Record<string, string>;

try {
  // Dynamically load from 'vite' if available
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const require = createRequire(import.meta.url);
  loadEnv = require("vite").loadEnv;
} catch {
  loadEnv = () => ({ });
}

export default defineConfig(({ mode }: { mode: string }) => {
  // Load env file based on `mode` in the current working directory.
  // By default, `mode` is `test` when running vitest
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return {
    plugins: [react()] as any,
    test: {
      environment: "jsdom",
      setupFiles: ["./test/setup.ts"],
      globals: true,
      include: ["**/*.test.{ts,tsx}"],
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://test-project.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000"
      }
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
  };
})
