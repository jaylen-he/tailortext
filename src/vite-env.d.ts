/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string;
    // Add other environment variables you're using here
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }