import { enableCloudSupport } from "../configs/global-configs.js";
import type { JiraConfig } from "../types/configs/client-configs.types.js";
import { IProductClient } from "./base.client.js";

/**
 * Client for the Jira REST API.
 *
 * Supports **selfHosted** (Server / Data Center) and **Cloud** deployments.
 * The deployment type is determined by `config.hosting`.
 *
 * Cloud        → `/rest/api/3/…` — Basic auth (email:apiToken)
 * selfHosted  → `/rest/api/2/…` — Bearer token auth (preferred) or Basic auth
 *
 * ⚠️  Cloud execution is BLOCKED at the constructor level. The cloud code
 *     is preserved for reference but will never execute.
 *
 * ⚠️ **Services must use the domain methods** below rather than calling
 * `get`/`post` directly, because some endpoints have different path
 * structures between v2 and v3 (e.g. search).
 */
export class JiraClient extends IProductClient {

  /**
   * Map of logical endpoint → version-specific relative paths.
   * Override entries here when the v2 and v3 paths differ structurally.
   */
  private static readonly VERSION_PATHS: Record<string, { 2: string; 3: string }> = {
    
    "/search": {
      2: "/search",
      3: "/search/jql", // Cloud v3 moved the endpoint under /jql
    },
    "/issue":{
      2: "/issue",
      3: "/issue"
    }
  };

  constructor(private config: JiraConfig) {
    super();
    // ── Cloud block ──────────────────────────────────────────
    // Cloud execution is disabled. The code is kept for reference
    // but will throw immediately if hosting is "cloud".
    if (config.hosting === "cloud" && !enableCloudSupport) {
      throw new Error(
        "Jira Cloud is not supported in this build. Set hosting to \"selfHosted\" in your config.",
      );
    }
  }

  // ── Abstract property implementations ─────────────────────────

  protected get baseUrl(): string {
    if (this.config.hosting === "cloud") {
      return `https://${this.config.cloud.site}.atlassian.net`;
    }
    return this.config.selfHosted.baseUrl.replace(/\/+$/, "");
  }

  /**
   * Cloud Jira uses REST API v3, selfHosted uses v2.
   */
  protected get apiPrefix(): string {
    if (this.config.hosting === "cloud") return "/rest/api/3";
    return "/rest/api/2";
  }

  /**
   * Resolves logical paths to version-specific paths, falling back to the
   * path as-is when no override exists.
   */
  protected buildPath(path: string): string {
    const pathSliced = path.split("?");
    const versionKey = this.config.hosting === "cloud" ? "3" : "2";
    const override = JiraClient.VERSION_PATHS[pathSliced[0]];

    // No version-specific override for this path — use the path itself.
    if (!override) {
      return super.buildPath(path);
    }

    const resolved = `${override[versionKey]}${pathSliced?.length > 1 ? `?${pathSliced[1]}` :``}`;
    return super.buildPath(resolved);
  }

  protected get headers(): Record<string, string> {
    if (this.config.hosting === "cloud") {
      const { email, apiToken } = this.config.cloud;
      const encoded = Buffer.from(`${email}:${apiToken}`).toString("base64");
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
