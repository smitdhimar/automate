import { HttpClient, httpClient } from "./http.client.js";

/**
 * Base class that every product client should extend.
 *
 * Provides concrete `get` / `post` / `put` / `delete` implementations
 * that delegate to the shared `HttpClient`. Subclasses only need to
 * define how to resolve `baseUrl`, `headers` and `apiPrefix` for their
 * product.
 *
 * The `apiPrefix` is **automatically** prepended to every path.
 * Subclasses can override `buildPath` to remap paths that differ
 * structurally between API versions.
 */
export abstract class IProductClient {

  protected http: HttpClient = httpClient;

  /**
   * Subclasses must provide the base URL for their API.
   */
  protected abstract get baseUrl(): string;

  /**
   * Subclasses must provide the authentication headers.
   */
  protected abstract get headers(): Record<string, string>;

  /**
   * API version prefix prepended to every path (e.g. `/rest/api/3`).
   * Return an empty string if the version is already baked into `baseUrl`.
   */
  protected get apiPrefix(): string {
    return "";
  }

  /**
   * Build the full API path by combining the prefix with the given path.
   * Subclasses may override this to remap paths that differ structurally
   * between versions.
   */
  protected buildPath(path: string): string {
    const prefix = this.apiPrefix.replace(/\/+$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return prefix ? `${prefix}${cleanPath}` : cleanPath;
  }

  get<T = unknown>(path: string): Promise<T> {
    console.log('this.buildPath(path) :>> ', this.buildPath(path));
    return this.http.get<T>(this.baseUrl, this.buildPath(path), this.headers);
  }

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.http.post<T>(this.baseUrl, this.buildPath(path), this.headers, body);
  }

  put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.http.put<T>(this.baseUrl, this.buildPath(path), this.headers, body);
  }

  delete<T = unknown>(path: string): Promise<T> {
    return this.http.delete<T>(this.baseUrl, this.buildPath(path), this.headers);
  }
}