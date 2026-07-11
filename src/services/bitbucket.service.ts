import { logger } from "../utils/logger.js";
import { ConfigService } from "./config.service.js";
import { BitbucketClient } from "../clients/bitbucket.client.js";
import type { BitbucketConfig } from "../types/configs/client-configs.types.js";
import { GitService } from "./git.service.js";

export class BitbucketService {

  private static _client: BitbucketClient | null = null;

  /**
   * Lazily initialised client. Reads config from disk on first call.
   */
  private static get client(): BitbucketClient {
    if (!this._client) {
      const config = ConfigService.readConfig();
      const bbConfig = config?.Bitbucket as BitbucketConfig | undefined;
      if (!bbConfig) {
        throw new Error("Bitbucket is not configured. Run `automate` to set up your config.");
      }
      this._client = new BitbucketClient(bbConfig);
    }
    return this._client;
  }

  static async createBranch(args: { issueNumber: string }) {
    logger.info(`Creating branch for issue ${args.issueNumber}`);

    // Example: get default branch from the repo to branch from
    const workspace = "your-workspace"; // TODO: pull from config or args
    const repoSlug = "your-repo";       // TODO: pull from config or args

    const defaultBranch = await this.client.get<{ name: string }>(
      `/repositories/${workspace}/${repoSlug}/refs/branches/default`,
    );

    const body = {
      name: `feature/${args.issueNumber}`,
      target: { hash: defaultBranch.name },
    };

    await this.client.post(`/repositories/${workspace}/${repoSlug}/refs/branches`, body);
    logger.plain(`✅ Branch feature/${args.issueNumber} created`);
  }

  static async listRepositories(args: { workspace: string }) {
    logger.info(`Listing repositories in workspace: ${args.workspace}`);
    const data = await this.client.get<{ values: unknown[] }>(
      `/repositories/${args.workspace}`,
    );
    logger.plain(`✅ Found ${data.values.length} repo(s)`);
    return data.values;
  }

  static async getPullRequests(args: { workspace: string; repo: string }) {
    logger.info(`Listing PRs for ${args.workspace}/${args.repo}`);
    const data = await this.client.get<{ values: unknown[] }>(
      `/repositories/${args.workspace}/${args.repo}/pullrequests`,
    );
    logger.plain(`✅ Found ${data.values.length} PR(s)`);
    return data.values;
  }
}
