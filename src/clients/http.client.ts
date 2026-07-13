/**
 * Thin wrapper around `fetch` that:
 *  - Builds the full URL from a base + path
 *  - Attaches headers (auth, content-type, etc.)
 *  - Logs requests and errors
 *  - Throws on non-2xx responses with a descriptive message
 */

export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  baseUrl: string;
  headers: Record<string, string>;
  body?: unknown;
}

export class HttpClient {

  async request<T = unknown>(opts: RequestOptions): Promise<T> {
    const url = `${opts.baseUrl.replace(/\/+$/, "")}${opts.path}`;

    const init: RequestInit = {
      method: opts.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...opts.headers,
      },
    };

    if (opts.body && opts.method !== "GET") {
      init.body = JSON.stringify(opts.body);
    }
    const res = await fetch(url, init);

    if (!res.ok) {
      const body = await res.text().catch(() => "(no body)");
      const msg = `[HTTP ${res.status}] ${opts.method} ${url} — ${body}`;
      throw new Error(msg);
    }

    // Some endpoints return 204 No Content
    if (res.status === 204) return undefined as T;

    return res.json() as Promise<T>;
  }

  get<T = unknown>(baseUrl: string, path: string, headers: Record<string, string>) {
    console.log('path :>> ', path);
    console.log('baseUrl :>> ', baseUrl);

    return this.request<T>({ method: "GET", path, baseUrl, headers });
  }

  post<T = unknown>(baseUrl: string, path: string, headers: Record<string, string>, body?: unknown) {
    return this.request<T>({ method: "POST", path, baseUrl, headers, body });
  }

  put<T = unknown>(baseUrl: string, path: string, headers: Record<string, string>, body?: unknown) {
    return this.request<T>({ method: "PUT", path, baseUrl, headers, body });
  }

  delete<T = unknown>(baseUrl: string, path: string, headers: Record<string, string>) {
    return this.request<T>({ method: "DELETE", path, baseUrl, headers });
  }
}

/** Singleton instance shared across all clients */
export const httpClient = new HttpClient();
