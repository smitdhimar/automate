import { logger } from "../utils/logger.js";

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
}
