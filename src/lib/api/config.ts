/** API mode: mock (in-memory seed) or live NestJS backend */
export function useMockApi(): boolean {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
    return true;
  }
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_MOCK_API === "false") {
    return false;
  }
  // Default: mock when no API URL configured (local UI dev)
  return !process.env.NEXT_PUBLIC_API_URL;
}

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1").replace(/\/$/, "");
}
