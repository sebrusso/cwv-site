import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // By default, `mode` is `test` when running vitest
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return {
    plugins: [react()],
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
