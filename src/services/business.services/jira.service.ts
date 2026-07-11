import { logger } from "../../utils/logger.js";
import { getIssueNumberFromBranch } from "../../utils/utilsForServices.ts/gitServiceUtils.js";
import { GitService } from "./git.service.js";
import { ConfigService } from "../cli.services/config.service.js";
import { JiraClient } from "../../clients/jira.client.js";
import type { JiraConfig } from "../../types/configs/client-configs.types.js";

export class JiraService {

  private static _client: JiraClient | null = null;

  /**
   * Lazily initialised client. Reads config from disk on first call.
   */
  private static get client(): JiraClient {
    if (!this._client) {
      const config = ConfigService.readConfig();
      const jiraConfig = config?.Jira as JiraConfig | undefined;
      if (!jiraConfig) {
        throw new Error("Jira is not configured. Run `automate` to set up your config.");
      }
      this._client = new JiraClient(jiraConfig);
    }
    return this._client;
  }

  static async listIssues(args: { project: string }) {
    logger.info(`Listing Jira issues for project: ${args.project}`);
    const data = await this.client.get<{ issues: unknown[] }>(
      `/rest/api/3/search/jql?jql=project=${encodeURIComponent(args.project)}`,
    );
    logger.success(`Found ${data?.issues?.length} issue(s)`);
    return data.issues;
  }

  static async createIssue(args: { project: string; summary: string; description?: string }) {
    logger.info(`Creating Jira issue in ${args.project}: ${args.summary}`);

    const body: Record<string, unknown> = {
      fields: {
        project: { key: args.project },
        summary: args.summary,
        issuetype: { name: "Task" },
      },
    };

    if (args.description) {
      (body.fields as Record<string, unknown>).description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: args.description }],
          },
        ],
      };
    }

    const issue = await this.client.post("/rest/api/3/issue", body);
    logger.plain(`✅ Issue created: ${(issue as { key: string }).key}`);
    return issue;
  }

  // get status of subtask from branch number
  static async getStatus(): Promise<string> {
    const branch = await GitService.getBranchName();
    const issueNumber = getIssueNumberFromBranch(branch);

    const data = await this.client.get<{ fields: { status: { name: string } } }>(
      `/rest/api/3/issue/${issueNumber}`,
    );
    logger.plain(`✅ Status for ${issueNumber}: ${data.fields.status.name}`);
    return data.fields.status.name;
  }
}