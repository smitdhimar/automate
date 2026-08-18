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
import { askForMissing } from "../../utils/userInputUtils.js";
import type {
  DevStatusBranch,
  DevStatusPullRequest,
  IssueDevStatus,
} from "../../types/jira/dev-status.types.js";

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
      const data = await this.client.get<{ issues: any[] }>(
        `/search?jql=project=${encodeURIComponent(this.projectKey)} and assignee=CurrentUser() and issuetype not in subTaskIssueTypes() and status IN ("To Do", "In Progress", "Under Review", "Assigned")&fields=summary,fixVersions,issuetype,status`,
      );

      const issues = data?.issues ?? [];
      logger.success(`Found ${issues.length} issue(s)`);

      // Each issue key is a clickable link to Jira (no dev-status here).
      const devStatus: IssueDevStatus[] = issues.map((issue: any) => ({
        url: this.getIssueUrl(issue.key),
      }));

      logIssueList(issues, devStatus);

      return { success: true, data: { issues, devStatus } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  static async listSubtasks(): Promise<ToolResult> {
    try {
      logger.info(`Listing Jira subtasks for project: ${this.projectKey}`);
      const data = await this.client.get<{ issues: any[] }>(
        `/search?jql=project=${encodeURIComponent(this.projectKey)} and assignee=CurrentUser() and issuetype in subTaskIssueTypes() and status NOT IN ("Complete", "Done")&fields=summary,fixVersions,issuetype,status`,
      );

      const issues = data?.issues ?? [];
      logger.success(`Found ${issues.length} subtask(s)`);

      // Enrich each subtask with its Jira link and dev-status
      // (branches & pull requests) via the dev-status API.
      const devStatus: IssueDevStatus[] = await Promise.all(
        issues.map(async (issue: any) => {
          const [branches, pullRequests] = await Promise.all([
            this.fetchDevStatus(issue.id, "branch"),
            this.fetchDevStatus(issue.id, "pullrequest"),
          ]);
          return {
            url: this.getIssueUrl(issue.key),
            branches,
            pullRequests,
          };
        }),
      );

      logIssueList(issues, devStatus);

      return { success: true, data: { issues, devStatus } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
  
  static async createSubtask(args: {
    parentIssueId: string;
    title: string;
    source: string;
    fixVersion?: string;
    repoSlug?: string;
    startPoint?: string;
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
      // Ask the user for the repo slug & start point when they weren't supplied —
      // config values are offered as pre-filled defaults, not silently used.
      const { repoSlug, startPoint } = await askForMissing([
        {
          name: "repoSlug",
          message: "Repo slug for the new branch?",
          current: args.repoSlug,
          default: this.config?.Bitbucket?.selfHosted?.defaultRepoSlug,
        },
        {
          name: "startPoint",
          message: "Branch to create the new branch from (start point)?",
          current: args.startPoint,
          default: this.config?.Git?.defaultDevStream,
        },
      ]);

      const branchResult = await BitbucketService.createBranch({
        issueNumber: issue.key,
        repoSlug,
        startPoint,
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
    source: string;
  }): Promise<ToolResult> {
    try {
      const transitionId = "71";

      logger.info(`Transitioning ${args.issueKey} to Done (transition id: ${transitionId})`);

      const jiraCfg = this.config?.Jira as JiraConfig | undefined;
      const sourceVal = args.source;

      const fields: Record<string, unknown> = {
        resolution: { name: "Done" },
        // ── Config-driven fields ─────────────────────────────
        ...(args.fixVersion ? { fixVersions: [{ name: args.fixVersion }] } : {}),
        // ── Custom fields from API doc ───────────────────────
        ...(sourceVal ? { "customfield_10313": sourceVal } : {}), // source
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

  /**
   * Jira browse URL for an issue key (used for the clickable hyperlink).
   */
  private static getIssueUrl(issueKey: string): string {
    const jiraCfg = this.config?.Jira as JiraConfig | undefined;
    const hosting = jiraCfg?.hosting ?? "selfHosted";
    const baseUrl =
      hosting === "cloud"
        ? `https://${jiraCfg?.cloud?.site}.atlassian.net`
        : (jiraCfg?.selfHosted?.baseUrl ?? "").replace(/\/+$/, "");
    return `${baseUrl}/browse/${encodeURIComponent(issueKey)}`;
  }

  /**
   * Fetch branches or pull requests linked to an issue via the dev-status API.
   * Failures are swallowed so a missing dev-status never breaks the listing.
   */
  private static async fetchDevStatus(
    issueId: string,
    dataType: "branch",
  ): Promise<DevStatusBranch[]>;
  private static async fetchDevStatus(
    issueId: string,
    dataType: "pullrequest",
  ): Promise<DevStatusPullRequest[]>;
  private static async fetchDevStatus(
    issueId: string,
    dataType: "branch" | "pullrequest",
  ): Promise<DevStatusBranch[] | DevStatusPullRequest[]> {
    try {
      const res = await this.client.getDevStatus(issueId, dataType);
      const repos = res?.detail?.[0]?.repositories ?? [];
      if (dataType === "branch") {
        return repos.flatMap((repo) => repo.branches ?? []);
      }
      return repos.flatMap((repo) => repo.pullRequests ?? []);
    } catch {
      return [];
    }
  }
}
