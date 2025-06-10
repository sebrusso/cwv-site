// Global type declarations to help with module resolution

declare module '@supabase/supabase-js' {
  export * from '@supabase/supabase-js/dist/module/index';
}

declare module '@supabase/ssr' {
  export * from '@supabase/ssr/dist/index';
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
      OPENAI_API_KEY: string;
      NEXT_PUBLIC_AUTH_BYPASS?: string;
    }
  }
}

// Extend the Window interface for react components that check for window
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
interface Window extends object {}

// Make sure the file is treated as a module
export {}; 