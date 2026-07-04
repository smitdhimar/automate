import { ToolRegistry } from "../tool.registry.js";
import { JiraService } from "../../services/jira.service.js";

export function registerJiraTools() {
    ToolRegistry.register({
        id: "jira.listIssues",
        category: "Jira",
        name: "List Issues",
        description: "List Jira issues for a project",
        arguments: [
            {
                name: "project",
                label: "Project Key",
                type: "string",
                required: true
            }
        ],
        handler: JiraService.listIssues
    });

    ToolRegistry.register({
        id: "jira.createIssue",
        category: "Jira",
        name: "Create Issue",
        description: "Create a new Jira issue",
        arguments: [
            {
                name: "project",
                label: "Project Key",
                type: "string",
                required: true
            },
            {
                name: "summary",
                label: "Summary",
                type: "string",
                required: true
            },
            {
                name: "description",
                label: "Description",
                type: "string",
                required: false
            }
        ],
        handler: JiraService.createIssue
    });
}
