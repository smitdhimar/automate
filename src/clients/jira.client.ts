import type { JiraConfig } from "../types/configs/client-configs.types.js";
import { IProductClient } from "./base.client.js";

/**
 * Client for the Jira REST API.
 *
 * Supports both **Cloud** (atlassian.net) and **Self-hosted** deployments.
 * The deployment type is determined by `config.hosting` — the rest of the
 * application never needs to care about which one is in use.
 *
 * Cloud  → `/rest/api/3/…`
 * Self-hosted → `/rest/api/2/…`
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
  };

  constructor(private config: JiraConfig) {
    super();
  }

  // ── Abstract property implementations ─────────────────────────

  protected get baseUrl(): string {
    return this.config.hosting === "cloud"
      ? `https://${this.config.cloud.site}.atlassian.net`
      : this.config.selfHosted.baseUrl.replace(/\/+$/, "");
  }

  /**
   * Cloud Jira uses REST API v3, self-hosted still uses v2.
   */
  protected get apiPrefix(): string {
    return this.config.hosting === "cloud" ? "/rest/api/3" : "/rest/api/2";
  }

  /**
   * Resolves logical paths to version-specific paths, falling back to the
   * path as-is when no override exists.
   */
  protected buildPath(path: string): string {
    const pathSliced = path.split("?");
    const versionKey = this.config.hosting === "cloud" ? "3" : "2";
    const override = JiraClient.VERSION_PATHS[pathSliced[0]];
    const resolved = override?.[versionKey] ?? path;
    return super.buildPath(resolved);
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

  // ── Domain methods ────────────────────────────────────────────

  /**
   * Search issues by JQL query.
   */
  async searchIssues(jql: string) {
    return this.get<{ issues: unknown[]; total: number }>(
      `/search?jql=${encodeURIComponent(jql)}`,
    );
  }

  /**
   * Get full details of a single issue.
   */
  async getIssue(issueNumber: string) {
    return this.get<{ fields: { status: { name: string } } }>(
      `/issue/${issueNumber}`,
    );
  }

  /**
   * Create a new issue.
   */
  async createIssue(
    project: string,
    summary: string,
    description?: string,
  ) {
    const body: Record<string, unknown> = {
      fields: {
        project: { key: project },
        summary,
        issuetype: { name: "Task" },
      },
    };

    if (description) {
      (body.fields as Record<string, unknown>).description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: description }],
          },
        ],
      };
    }

    return this.post<{ key: string; id: string }>("/issue", body);
  }
}
