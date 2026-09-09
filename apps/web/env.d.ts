declare namespace Cloudflare {
  interface Env {
    FILES: R2Bucket;
    OAUTH_TOKEN_ENCRYPTION_KEY: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GEMINI_API_KEY: string;
  }
}
