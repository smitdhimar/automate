import type { BitbucketConfig } from "../types/configs/client-configs.types.js";
import { IProductClient } from "./base.client.js";

/**
 * Client for the Bitbucket REST API.
 *
 * Supports both **Cloud** (bitbucket.org) and **Self-hosted** (Bitbucket
 * Server / Data Center) deployments. The deployment type is determined by
 * `config.hosting` — the rest of the application never needs to care about
 * which one is in use.
 *
 * `get` / `post` / `put` / `delete` are inherited from `IProductClient`.
 */
export class BitbucketClient extends IProductClient {

  constructor(private config: BitbucketConfig) {
    super();
  }

  // ── Abstract property implementations ─────────────────────────

  protected get baseUrl(): string {
    if (this.config.hosting === "cloud") {
      return "https://api.bitbucket.org/2.0";
    }
    // Self-hosted Bitbucket Server
    return `${this.config.selfHosted.baseUrl.replace(/\/+$/, "")}/rest/api/1.0`;
  }

  protected get headers(): Record<string, string> {
    if (this.config.hosting === "cloud") {
      const { username, appPassword } = this.config.cloud;
      const encoded = Buffer.from(`${username}:${appPassword}`).toString("base64");
      return { Authorization: `Basic ${encoded}` };
    }

    // Self-hosted: Basic auth with username + password
    const { username, password } = this.config.selfHosted;
    const encoded = Buffer.from(`${username}:${password}`).toString("base64");
    return { Authorization: `Basic ${encoded}` };
  }
}
