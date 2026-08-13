import { logger } from "../../utils/logger.js";
import { logIssueList } from "../../utils/utilsForServices.ts/jiraLogUtils.js";
import { getIssueNumberFromBranch } from "../../utils/utilsForServices.ts/gitServiceUtils.js";
import { GitService } from "./git.service.js";
import { BitbucketService } from "./bitbucket.service.js";
import { ConfigService } from "../cli.services/config.service.js";
import { JiraClient } from "../../clients/jira.client.js";
import type { JiraConfig } from "../../types/configs/client-configs.types.js";
import type { ToolResult } from "../../types/configs/ui-configs.types/tool-configs.types.js";
import { applyTransition, fetchTransitions, findTransition } from "../../utils/utilsForServices.ts/jiraServiceUtils.js";

export class JiraService {

  private static _client: JiraClient | null = null;
  private static config = ConfigService.readConfig();
  private static projectKey = this.config?.Jira?.defaultProject ;
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

  static async listIssues(): Promise<ToolResult> {
    try {
      logger.info(`Listing Jira issues for project: ${this.projectKey}`);
      const data = await this.client.get<{ issues: unknown[] }>(
        `/search?jql=project=${encodeURIComponent(this.projectKey)} and assignee=CurrentUser() and issuetype not in subTaskIssueTypes() and status IN ("To Do", "In Progress", "Under Review", "Assigned")&fields=summary,fixVersions,issuetype,status`,
      );

      logger.success(`Found ${data?.issues?.length} issue(s)`);
      logIssueList(data.issues as any[]);

      return { success: true, data: { issues: data.issues } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  static async listSubtasks(): Promise<ToolResult> {
    try {
      logger.info(`Listing Jira subtasks for project: ${this.projectKey}`);
      const data = await this.client.get<{ issues: unknown[] }>(
        `/search?jql=project=${encodeURIComponent(this.projectKey)} and assignee=CurrentUser() and issuetype in subTaskIssueTypes() and status IN ("To Do", "In Progress", "Under Review", "Assigned")&fields=summary,fixVersions,issuetype,status`,
      );

      logger.success(`Found ${data?.issues?.length} subtask(s)`);
      logIssueList(data.issues as any[]);

      return { success: true, data: { issues: data.issues } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  static async createIssue(args: { summary: string; description?: string }): Promise<ToolResult> {
    try {
      logger.info(`Creating Jira issue in ${this.projectKey}: ${args.summary}`);

      const body: Record<string, unknown> = {
        fields: {
          project: { key: this.projectKey },
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
    parentIssueId: string;
    title: string;
    source: string;
    fixVersion?: string;
  }): Promise<ToolResult> {
    try {
      logger.info(`Creating subtask under ${args.parentIssueId} in project ${this.projectKey}`);

      const jiraCfg = this.config?.Jira as JiraConfig | undefined;
      const sourceVal = args.source || jiraCfg?.defaultSource;
      const fixVer = args.fixVersion || jiraCfg?.defaultFixVersion;


      // mappings :
      // customfield_10200 -> activity type
      // customfield_10313 -> resolution comments
      // customfield_10221 -> affected functional area
      // customfield_12317 -> team
      // customfield_10239 -> source
      const fields: Record<string, unknown> = {
        project: { key: this.projectKey },
        summary: args.title,
        issuetype: { name: "Sub-task" },
        parent: { key: args.parentIssueId },
        "customfield_10200": { value: "Code Change Activity"},
        "customfield_10313": " ",
        // ── Config-driven standard fields ────────────────────
        ...(fixVer ? { fixVersions: [{ name: fixVer }] } : {}),
        ...(jiraCfg?.assignee ? { assignee: { name: jiraCfg.assignee } } : {}),
        // ── Custom fields from API doc ───────────────────────
        ...(jiraCfg?.affectedFunctionalArea ? { "customfield_10221": [{ value: jiraCfg.affectedFunctionalArea }] } : {}),
        ...(jiraCfg?.team ? { "customfield_12317": { value: jiraCfg.team } } : {}),
        ...(sourceVal ? { "customfield_10239": { value: sourceVal } } : {}),
      };

      const body: Record<string, unknown> = { fields };

      const issue = await this.client.post<{ key: string; id: string }>("/issue", body);
      logger.plain(`✅ Subtask created: ${issue.key} under ${args.parentIssueId}`);

      // ── Move the subtask to "In Progress" (best effort) ─────
      const transitionResult = await this.transitionToInProgress({ issueId: issue.key });
      if (!transitionResult.success) {
        logger.warn(`Could not transition ${issue.key} to In Progress: ${transitionResult.error ?? "unknown error"}`);
      }

      // ── Create a branch for the subtask in Bitbucket ────────
      const branchResult = await BitbucketService.createBranch({
        issueNumber: issue.key,
        repoSlug: this.config?.Bitbucket?.selfHosted?.defaultRepoSlug ?? "",
        startPoint: this.config?.Git?.defaultDevStream ?? "",
        issueSummary: args.title,
      });
      if (!branchResult.success) {
        return { success: false, error: branchResult.error };
      }

      return {
        success: true,
        data: {
          key: issue.key,
          parent: args.parentIssueId,
          branch: branchResult.data?.branchName,
          latestCommit: branchResult.data?.latestCommit,
        },
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Transition a subtask from "In Progress" to "Done".
   *
   * POST /rest/api/2/issue/{issueKey}/transitions
   */
  static async transitionSubtaskToDone(args: {
    issueKey: string;
    fixVersion: string;
  }): Promise<ToolResult> {
    try {
      const transitionId = "71";

      logger.info(`Transitioning ${args.issueKey} to Done (transition id: ${transitionId})`);

      const jiraCfg = this.config?.Jira as JiraConfig | undefined;
      const sourceVal = jiraCfg?.defaultSource;

      const fields: Record<string, unknown> = {
        resolution: { name: "Done" },
        // ── Config-driven fields ─────────────────────────────
        ...(args.fixVersion ? { fixVersions: [{ name: args.fixVersion }] } : {}),
        // ── Custom fields from API doc ───────────────────────
        ...(sourceVal ? { "customfield_10313": sourceVal } : {}),
        ...(sourceVal ? { "customfield_10239": { value: sourceVal } } : {}),
      };

      const body: Record<string, unknown> = {
        transition: { id: transitionId },
        fields,
      };

      await this.client.post(`/issue/${args.issueKey}/transitions`, body);
      logger.plain(`✅ ${args.issueKey} transitioned to Done`);
      return { success: true, data: { issueKey: args.issueKey, status: "Done" } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // /**
  //  * Get available transitions for an issue (useful for finding the right transition ID).
  //  */
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

  /**
   * Move an issue to "In Progress".
   *
   * If a direct transition to "In Progress" is available (e.g. from "Assigned"),
   * it is used. Otherwise the issue is first transitioned to "Assigned"
   * (e.g. from "Open") and then to "In Progress".
   *
   * Hidden tool — registered in the registry but NOT listed in the menu.
   */
  static async transitionToInProgress(args: { issueId: string }): Promise<ToolResult> {
    try {
      const { issueId } = args;
      logger.info(`Moving ${issueId} to In Progress`);

      // 1) Direct transition to "In Progress" (e.g. from "Assigned")
      let transitions = await fetchTransitions(this.client, issueId);
      const direct = findTransition(transitions, "In Progress");
      if (direct) {
        await applyTransition(this.client, issueId, direct.id);
        logger.success(`✅ ${issueId} transitioned to In Progress`);
        return { success: true, data: { issueId, status: "In Progress" } };
      }

      // 2) Fallback: "Open" → "Assigned", then "Assigned" → "In Progress"
      const toAssigned = findTransition(transitions, "Assigned");
      if (toAssigned) {
        await applyTransition(this.client, issueId, toAssigned.id);
        logger.plain(`✅ ${issueId} transitioned to Assigned`);
      }

      transitions = await fetchTransitions(this.client, issueId);
      const retry = findTransition(transitions, "In Progress");
      if (retry) {
        await applyTransition(this.client, issueId, retry.id);
        logger.success(`✅ ${issueId} transitioned to In Progress`);
        return { success: true, data: { issueId, status: "In Progress" } };
      }

      return {
        success: false,
        error: `No transition to "In Progress" (or via "Assigned") available for ${issueId}`,
      };
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

  // get objective summary
  static async getObjectiveSummary(args:{issueNumber: string}): Promise<ToolResult> {
    try{  
      const res = await this.client.get<{ issues: Array<{ key: string; fields: { summary: string } }> }>(
          `/search?jql=key=${encodeURIComponent(args.issueNumber)}&fields=summary`,
        );
      const summary = res?.issues?.[0]?.fields?.summary;
      if(!summary){
        return { success: false }
      }
      return { success: true, data: {summary: summary}};
    }
    catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}
