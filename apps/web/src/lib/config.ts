export const config = {
  // Default to the Nest API dev server.
  // Override via NEXT_PUBLIC_API_BASE_URL when deploying.
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api",
} as const;
