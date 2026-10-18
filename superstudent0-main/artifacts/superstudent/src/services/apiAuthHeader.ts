/**
 * Adds "Authorization: Bearer <token>" to same-origin /api/* requests when the user is logged
 * in on the server (JWT from /api/auth/login). Existing fetch calls elsewhere in the app keep
 * working unchanged. Requests that already carry an Authorization header are left alone.
 */
import { getStoredToken } from "./authClient";

let installed = false;

export function installApiAuthHeader(): void {
  if (installed || typeof window === "undefined" || typeof window.fetch !== "function") return;
  installed = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const isApi = url.startsWith("/api/") || url.startsWith(`${window.location.origin}/api/`);
      const token = isApi ? getStoredToken() : null;
      if (token) {
        const baseHeaders = init?.headers ?? (typeof input === "string" || input instanceof URL ? undefined : input.headers);
        const headers = new Headers(baseHeaders);
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
          return originalFetch(input, { ...init, headers });
        }
      }
    } catch {
      // fall through to the untouched request
    }
    return originalFetch(input, init);
  };
}
