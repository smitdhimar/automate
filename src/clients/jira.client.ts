import type { JiraConfig } from "../types/configs/client-configs.types.js";
import { IProductClient } from "./base.client.js";

/**
 * Client for the Jira REST API.
 *
 * Supports both **Cloud** (atlassian.net) and **Self-hosted** deployments.
 * The deployment type is determined by `config.hosting` — the rest of the
 * application never needs to care about which one is in use.
 *
 * `get` / `post` / `put` / `delete` are inherited from `IProductClient`.
 */
export class JiraClient extends IProductClient {

  constructor(private config: JiraConfig) {
    super();
  }

  // ── Abstract property implementations ─────────────────────────

  protected get baseUrl(): string {
    return this.config.hosting === "cloud"
      ? `https://${this.config.cloud.site}.atlassian.net`
      : this.config.selfHosted.baseUrl.replace(/\/+$/, "");
  }

  protected get headers(): Record<string, string> {
    if (this.config.hosting === "cloud") {
      const { email, apiToken } = this.config.cloud;
      const encoded = Buffer.from(`${email}:${apiToken}`).toString("base64");
      return { Authorization: `Basic ${encoded}` };
    }

    // Self-hosted: Basic auth with username + password
    const { username, password } = this.config.selfHosted;
    const encoded = Buffer.from(`${username}:${password}`).toString("base64");
    return { Authorization: `Basic ${encoded}` };
  }
}
