import { logger } from "../utils/logger.js";
import { getIssueNumberFromBranch } from "../utils/utilsForServices.ts/gitServiceUtils.js";
import { GitService } from "./git.service.js";

export class JiraService {

    static async listIssues(args: { project: string }) {
        logger.info(`Listing Jira issues for project: ${args.project}`);
        // TODO: Implement Jira API integration
        logger.plain(`ℹ️  Jira integration not yet implemented.`);
    }

    static async createIssue(args: { project: string; summary: string; description?: string }) {
        logger.info(`Creating Jira issue in ${args.project}: ${args.summary}`);
        // TODO: Implement Jira API integration
        logger.plain(`ℹ️  Jira integration not yet implemented.`);
    }

    // get status of subtask from branch number
    static async getStatus(): Promise<string> {
        const branch = await GitService.getBranchName();
        const issueNumber = getIssueNumberFromBranch(branch);

        // api call for getting status of issue number
        return issueNumber;
    }
}
