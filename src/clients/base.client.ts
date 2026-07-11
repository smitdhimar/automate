import { HttpClient, httpClient } from "./http.client.js";

/**
 * Base class that every product client should extend.
 *
 * Provides concrete `get` / `post` / `put` / `delete` implementations
 * that delegate to the shared `HttpClient`. Subclasses only need to
 * define how to resolve `baseUrl` and `headers` for their product.
 */
export abstract class IProductClient {

  constructor(protected http: HttpClient = httpClient) {}

  /**
   * Subclasses must provide the base URL for their API.
   */
  protected abstract get baseUrl(): string;

  /**
   * Subclasses must provide the authentication headers.
   */
  protected abstract get headers(): Record<string, string>;

  get<T = unknown>(path: string): Promise<T> {
    return this.http.get<T>(this.baseUrl, path, this.headers);
  }

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.http.post<T>(this.baseUrl, path, this.headers, body);
  }

  put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.http.put<T>(this.baseUrl, path, this.headers, body);
  }

  delete<T = unknown>(path: string): Promise<T> {
    return this.http.delete<T>(this.baseUrl, path, this.headers);
  }
}