import { logger } from "../../utils/logger.js";
import { logIssueList } from "../../utils/jiraLogUtils.js";
import { getIssueNumberFromBranch } from "../../utils/utilsForServices.ts/gitServiceUtils.js";
import { GitService } from "./git.service.js";
import { ConfigService } from "../cli.services/config.service.js";
import { JiraClient } from "../../clients/jira.client.js";
import type { JiraConfig } from "../../types/configs/client-configs.types.js";
import type { ToolResult } from "../../types/configs/ui-configs.types/tool-configs.types.js";

export class JiraService {

  private static _client: JiraClient | null = null;
  private static config = ConfigService.readConfig();
  /**
   * Lazily initialised client. Reads config from disk on first call.
   */
  private static get client(): JiraClient {
    if (!this._client) {
      const jiraConfig = this.config?.Jira as JiraConfig | undefined;
      if (!jiraConfig) {
        throw new Error("Jira is not configured. Run `automate` to set up your config.");
      }
      this._client = new JiraClient(jiraConfig);
    }
    return this._client;
  }

  static async listIssues(args: { project: string }): Promise<ToolResult> {
    try {
      logger.info(`Listing Jira issues for project: ${args.project}`);
      const data = await this.client.get<{ issues: unknown[] }>(
        `/search?jql=project=${encodeURIComponent(args.project)} and assignee=CurrentUser() and issuetype not in subTaskIssueTypes() and status IN ("To Do", "In Progress", "Under Review", "Assigned")&fields=description,fixVersions,issuetype,status`,
      );

      logger.success(`Found ${data?.issues?.length} issue(s)`);
      logIssueList(data.issues as any[]);

      return { success: true, data: { issues: data.issues } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  static async listSubtasks(args: { project: string }): Promise<ToolResult> {
    try {
      logger.info(`Listing Jira subtasks for project: ${args.project}`);
      const data = await this.client.get<{ issues: unknown[] }>(
        `/search?jql=project=${encodeURIComponent(args.project)} and assignee=CurrentUser() and issuetype in subTaskIssueTypes() and status IN ("To Do", "In Progress", "Under Review", "Assigned")&fields=description,fixVersions,issuetype,status`,
      );

      logger.success(`Found ${data?.issues?.length} subtask(s)`);
      logIssueList(data.issues as any[]);

      return { success: true, data: { issues: data.issues } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  static async createIssue(args: { project: string; summary: string; description?: string }): Promise<ToolResult> {
    try {
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

      const issue = await this.client.post<{ key: string }>("/issue", body);
      logger.plain(`✅ Issue created: ${issue.key}`);
      return { success: true, data: { key: issue.key } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  static async createSubtask(args: {
    project: string;
    parentIssueId: string;
    title: string;
    affectedArea: string;
    team: string;
    fixVersion?: string;
    description?: string;
  }): Promise<ToolResult> {
    try {
      logger.info(`Creating subtask under ${args.parentIssueId} in project ${args.project}`);

      const body: Record<string, unknown> = {
        fields: {
          project: { key: args.project },
          summary: args.title,
          issuetype: { name: "Subtask" },
          parent: { key: args.parentIssueId },
          ...( this?.config?.jira?.hosting === 'cloud' ? null : {fixVersions: [{ name: args.fixVersion }]}),
          labels: [args.affectedArea, args.team],
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: args?.description }],
              },
            ],
          },
        },
      };

      const issue = await this.client.post<{ key: string; id: string }>("/issue", body);
      logger.plain(`✅ Subtask created: ${issue.key} under ${args.parentIssueId}`);
      return { success: true, data: { key: issue.key, parent: args.parentIssueId } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // get status of subtask from branch number
  static async getStatus(): Promise<ToolResult> {
    try {
      const branchResult = await GitService.getBranchName();
      if (!branchResult.success || !branchResult.data?.branch) {
        return { success: false, error: "Could not determine current branch name" };
      }
      const branch = branchResult.data.branch;
      const issueNumber = getIssueNumberFromBranch(branch);

      const data = await this.client.get<{ fields: { status: { name: string } } }>(
        `/issue/${issueNumber}`,
      );
      logger.plain(`✅ Status for ${issueNumber}: ${data.fields.status.name}`);
      return { success: true, data: { issueNumber, status: data.fields.status.name } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}