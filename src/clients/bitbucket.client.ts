import type { BitbucketConfig } from "../types/configs/client-configs.types.js";
import { IProductClient } from "./base.client.js";
import { enableCloudSupport } from "../configs/global-configs.js";
/**
 * Client for the Bitbucket REST API.
 *
 * Supports **selfHosted** (Bitbucket Server / Data Center) and **Cloud**
 * deployments. The deployment type is determined by `config.hosting`.
 *
 * Cloud        → api.bitbucket.org/2.0 — Basic auth (username:appPassword)
 * selfHosted  → /rest/api/1.0         — Bearer token auth (preferred) or Basic auth
 *
 * ⚠️  Cloud execution is BLOCKED at the constructor level. The cloud code
 *     is preserved for reference but will never execute.
 *
 * `get` / `post` / `put` / `delete` are inherited from `IProductClient`.
 */
export class BitbucketClient extends IProductClient {

  constructor(private config: BitbucketConfig) {
    super();
    // ── Cloud block ──────────────────────────────────────────
    // Cloud execution is disabled. The code is kept for reference
    // but will throw immediately if hosting is "cloud".
    if (config.hosting === "cloud" && !enableCloudSupport) {
      throw new Error(
        "Bitbucket Cloud is not supported in this build. Set hosting to \"selfHosted\" in your config.",
      );
    }
  }

  // ── Abstract property implementations ─────────────────────────

  protected get baseUrl(): string {
    if (this.config.hosting === "cloud") {
      return "https://api.bitbucket.org/2.0";
    }
    // selfHosted Bitbucket Server / Data Center
    return `${this.config.selfHosted.baseUrl.replace(/\/+$/, "")}/rest/api/1.0`;
  }

  protected get headers(): Record<string, string> {
    if (this.config.hosting === "cloud") {
      const { username, appPassword } = this.config.cloud;
      const encoded = Buffer.from(`${username}:${appPassword}`).toString("base64");
      return { Authorization: `Basic ${encoded}` };
    }

    // selfHosted: prefer Bearer token (apiToken) if available, else Basic auth
    const { apiToken, username, password } = this.config.selfHosted;
    if (apiToken) {
      return { Authorization: `Bearer ${apiToken}` };
    }
    const encoded = Buffer.from(`${username}:${password}`).toString("base64");
    return { Authorization: `Basic ${encoded}` };
  }
}
