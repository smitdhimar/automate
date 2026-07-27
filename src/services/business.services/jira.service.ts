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

  /**
   * Helper: get the hosting type from config.
   */
  private static get hosting(): string {
    return (this.config?.Jira as JiraConfig | undefined)?.hosting ?? "selfHosted";
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
    affectedArea?: string;
    team?: string;
    fixVersion?: string;
    description?: string;
    assigneeName?: string;
  }): Promise<ToolResult> {
    try {
      logger.info(`Creating subtask under ${args.parentIssueId} in project ${args.project}`);

      const fields: Record<string, unknown> = {
        project: { key: args.project },
        summary: args.title,
        issuetype: { name: "Sub-task" },
        parent: { key: args.parentIssueId },
      };

      // Data Center / selfHosted: fixVersions is a plain array of objects
      if (this.hosting !== "cloud" && args.fixVersion) {
        fields.fixVersions = [{ name: args.fixVersion }];
      }

      // Assignee (Data Center uses account name / username)
      if (args.assigneeName) {
        fields.assignee = { name: args.assigneeName };
      }

      // Description in ADF format (common across all hosting types)
      if (args.description) {
        fields.description = {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: args.description }],
            },
          ],
        };
      } else {
        fields.description = `${args.title}`;
      }

      const body: Record<string, unknown> = { fields };

      const issue = await this.client.post<{ key: string; id: string }>("/issue", body);
      logger.plain(`✅ Subtask created: ${issue.key} under ${args.parentIssueId}`);
      return { success: true, data: { key: issue.key, parent: args.parentIssueId } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Transition a subtask from "In Progress" to "Done".
   *
   * Uses the Data Center v2 API format:
   *   POST /rest/api/2/issue/{issueKey}/transitions
   *
   * The transition ID ("71" = Done) must be provided. Custom fields
   * (resolution, fixVersions, etc.) are configurable via args.
   */
  static async transitionSubtaskToDone(args: {
    issueKey: string;
    transitionId?: string;
    fixVersion?: string;
    resolution?: string;
  }): Promise<ToolResult> {
    try {
      const transitionId = args.transitionId || "71";
      const resolution = args.resolution || "Done";

      logger.info(`Transitioning ${args.issueKey} to Done (transition id: ${transitionId})`);

      const body: Record<string, unknown> = {
        transition: { id: transitionId },
        fields: {
          resolution: { name: resolution },
        },
      };

      // Add fixVersion if provided
      if (args.fixVersion) {
        (body.fields as Record<string, unknown>).fixVersions = [{ name: args.fixVersion }];
      }

      await this.client.post(`/issue/${args.issueKey}/transitions`, body);
      logger.plain(`✅ ${args.issueKey} transitioned to Done`);
      return { success: true, data: { issueKey: args.issueKey, status: "Done" } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Get available transitions for an issue (useful for finding the right transition ID).
   */
  static async getTransitions(args: { issueKey: string }): Promise<ToolResult> {
    try {
      const data = await this.client.get<{ transitions: Array<{ id: string; name: string; to: { name: string } }> }>(
        `/issue/${args.issueKey}/transitions`,
      );
      logger.plain(`✅ Found ${data.transitions.length} transition(s) for ${args.issueKey}`);
      return { success: true, data: { transitions: data.transitions } };
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