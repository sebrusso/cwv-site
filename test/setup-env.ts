import { beforeAll } from "vitest";

beforeAll(() => {
  // Mock environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
});
