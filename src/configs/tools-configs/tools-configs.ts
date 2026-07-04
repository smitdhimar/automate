import { GitService } from "../../services/git.service.js"
import { JiraService } from "../../services/jira.service.js"
import { ToolDefinition } from "../../types/configs/ui-configs.types/tool-configs.types.js"

export const gitTools: ToolDefinition[] = [
    {
        id:"git.status",
        category:"Git",
        name: "Status",
        description:"Show repository status",
        arguments: [],
        handler: GitService.status,
        listTool: true
    },
    {
        id: "git.checkout",
        category: "Git",
        name: "Checkout Branch",
        description: "Checkout a branch",
        arguments: [
            {
                name: "branch",
                label: "Branch Name",
                type: "string",
                required: true
            }
        ],
        handler: GitService.checkout,
        listTool: true
    }
]

export const jiraTools: ToolDefinition[] = [
    {
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
        handler: JiraService.listIssues,
        listTool: false
    },
    {
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
        handler: JiraService.createIssue,
        listTool: false
    }
]