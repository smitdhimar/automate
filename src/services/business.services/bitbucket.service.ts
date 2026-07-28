import { logger } from "../../utils/logger.js";
import { ConfigService } from "../cli.services/config.service.js";
import { BitbucketClient } from "../../clients/bitbucket.client.js";
import type { BitbucketConfig } from "../../types/configs/client-configs.types.js";
import type { ToolResult } from "../../types/configs/ui-configs.types/tool-configs.types.js";
import { GitService } from "./git.service.js";

export class BitbucketService {

  private static _client: BitbucketClient | null = null;
  /**
   * Read full config (fresh each time so defaults are always current).
   */
  private static get rawConfig(): Record<string, any> | null {
    return ConfigService.readConfig();
  }

  private static projectKey = this?.rawConfig?.Bitbucket?.selfHosted?.defaultProjectKey;

  /**
   * Lazily initialised client. Reads config from disk on first call.
   */
  private static get client(): BitbucketClient {
    if (!this._client) {
      const config = this.rawConfig;
      const bbConfig = config?.Bitbucket as BitbucketConfig | undefined;
      if (!bbConfig) {
        throw new Error("Bitbucket is not configured. Run `automate` to set up your config.");
      }
      this._client = new BitbucketClient(bbConfig);
    }
    return this._client;
  }

  /**
   * Resolve the project key from args or config default.
   */
  private static resolveProjectKey(argsProjectKey?: string): string {
    if (argsProjectKey) return argsProjectKey;
    const bbConfig = this.rawConfig?.Bitbucket as BitbucketConfig | undefined;
    const projectKey = bbConfig?.selfHosted?.defaultProjectKey;
    if (projectKey) return projectKey;
    throw new Error("No project key provided and no default configured in Bitbucket.selfHosted.defaultProjectKey");
  }

  /**
   * Resolve the repo slug from args or config default.
   */
  private static resolveRepoSlug(argsRepoSlug?: string): string {
    if (argsRepoSlug) return argsRepoSlug;
    const bbConfig = this.rawConfig?.Bitbucket as BitbucketConfig | undefined;
    const repoSlug = bbConfig?.selfHosted?.defaultRepoSlug;
    if (repoSlug) return repoSlug;
    throw new Error("No repo slug provided and no default configured in Bitbucket.selfHosted.defaultRepoSlug");
  }

  /**
   * Resolve reviewers list from config.
   */
  private static getReviewers(): Array<{ user: { name: string } }> {
    const bbConfig = this.rawConfig?.Bitbucket as BitbucketConfig | undefined;
    const reviewerNames = bbConfig?.selfHosted?.reviewers ?? [];
    return reviewerNames.map(name => ({ user: { name } }));
  }

  // ── selfHosted Bitbucket API ─────────────────────────────────

  /**
   * Create a branch in Bitbucket (selfHosted / Data Center).
   *
   * POST {baseUrl}/rest/api/1.0/projects/{projectKey}/repos/{repoSlug}/branches
   *
   * Body: { "name": "feature/EL-12345", "startPoint": "release/release_35.0.0" }
   */
  static async createBranch(args: {
    issueNumber: string;
    repoSlug: string;
    startPoint: string;
    issueSummary?: string
  }): Promise<ToolResult> {
    try {
      const projectKey = this.projectKey;
      const repoSlug = this.resolveRepoSlug(args.repoSlug);
      const startPoint = args.startPoint;

      // ── Resolve issue summary ────────────────────────────────
      let summary = args.issueSummary;
      if (!summary) {
        const res = await this.client.get<{ issues: Array<{ key: string; fields: { summary: string } }> }>(
          `/search?jql=key=${encodeURIComponent(args.issueNumber)}&fields=summary`,
        );
        summary = res?.issues?.[0]?.fields?.summary;
      }
      if (!summary) {
        throw new Error(`Could not fetch summary for issue ${args.issueNumber}`);
      }

      // ── Build branch name ────────────────────────────────────
      // feature/EL-12345-some-description (max 100 chars)
      const slug = summary
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const suffix = slug.length > 0 ? `-${slug}` : "";
      const maxLen = 100;
      const prefix = `feature/${args.issueNumber}`;
      // Truncate slug so the full name fits within maxLen
      const available = maxLen - prefix.length - 1; // -1 for the hyphen
      const branchName = available > 0 && slug.length > available
        ? `${prefix}-${slug.slice(0, available)}`
        : `${prefix}${suffix}`;

      logger.info(`Creating branch ${branchName} from ${startPoint} in ${projectKey}/${repoSlug}`);

      const body = {
        name: branchName,
        startPoint,
      };

      const result = await this.client.post<{
        id: string;
        displayId: string;
        type: string;
        latestCommit: string;
      }>(`/projects/${projectKey}/repos/${encodeURIComponent(repoSlug)}/branches`, body);

      logger.plain(`✅ Branch ${result.displayId} created (commit: ${result.latestCommit})`);
      return { success: true, data: { branchName, latestCommit: result.latestCommit, projectKey, repoSlug } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Create a pull request in Bitbucket (selfHosted / Data Center).
   *
   * POST {baseUrl}/rest/api/1.0/projects/{projectKey}/repos/{repoSlug}/pull-requests
   */
  static async createPullRequest(args: {
    title: string;
    toBranch: string;
    repoSlug: string;
  }): Promise<ToolResult> {
    try {
      const projectKey = this.projectKey;
      const repoSlug = this.resolveRepoSlug(args.repoSlug);
      const branchRes = await GitService.getBranchName();
      const fromBranch = branchRes.data.branch;

      logger.info(`Creating PR: ${args.title} (${fromBranch} → ${args.toBranch})`);

      const body: Record<string, unknown> = {
        title: args.title,
        state: "OPEN",
        open: true,
        closed: false,
        locked: false,
        fromRef: {
          id: `refs/heads/${fromBranch}`,
          repository: {
            slug: repoSlug,
            project: { key: projectKey },
          },
        },
        toRef: {
          id: `refs/heads/${args.toBranch}`,
          repository: {
            slug: repoSlug,
            project: { key: projectKey },
          },
        },
        reviewers: this.getReviewers(),
      };

      const result = await this.client.post<{ id: number; title: string; state: string; version: number }>(
        `/projects/${encodeURIComponent(projectKey)}/repos/${encodeURIComponent(repoSlug)}/pull-requests`,
        body,
      );

      logger.plain(`✅ PR #${result.id} created: ${result.title}`);
      return { success: true, data: { prId: result.id, version: result.version, title: result.title, state: result.state } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Auto-merge / try-merge a pull request in Bitbucket (selfHosted / Data Center).
   *
   * POST {baseUrl}/rest/api/1.0/projects/{projectKey}/repos/{repoSlug}/pull-requests/{prId}/merge?version={version}
   */
  static async autoMergePullRequest(args: {
    prId: number;
    repoSlug: string;
    message: string;
  }): Promise<ToolResult> {
    try {
      const projectKey = this.projectKey;
      const repoSlug = this.resolveRepoSlug(args.repoSlug);

      logger.info(`Auto-merging PR #${args.prId}`);

      const body = {
        autoSubject: false,
        message: args.message || `Pull request #${args.prId}`,
        autoMerge: true,
        bypassMergeQueue: false,
      };

      const result = await this.client.post<{ id: number; state: string; version: number }>(
        `/projects/${encodeURIComponent(projectKey)}/repos/${encodeURIComponent(repoSlug)}/pull-requests/${args.prId}/merge?version=${0}`,
        body,
      );

      logger.plain(`✅ PR #${result.id} merge attempted — state: ${result.state}`);
      return { success: true, data: { prId: result.id, state: result.state } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}
