import { GitService } from "../../services/business.services/git.service.js"
import { JiraService } from "../../services/business.services/jira.service.js"
import { BitbucketService } from "../../services/business.services/bitbucket.service.js"
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
    },
    {
        id:"git.stash",
        category:"Git",
        name: "Stash",
        description:"Take a stash",
        arguments: [],
        handler: GitService.stash,
        listTool: true
    },
    {
        id:"git.stashPop",
        category:"Git",
        name: "Stash Pop",
        description:"Stash pop",
        arguments: [],
        handler: GitService.stashPop,
        listTool: true
    },
    {
        id:"git.push",
        category:"Git",
        name: "Push",
        description:"Push to current branch",
        arguments: [],
        handler: GitService.push,
        listTool: false
    },
    {
        id: "git.pull",
        category: "Git",
        name: "Pull",
        description: "Pull from specified branch",
        arguments: [
            {
                name: "branch",
                label: "Branch Name",
                type: "string",
                required: true
            }
        ],
        handler: GitService.pullFrom,
        listTool: true
    },
    {
        id: "git.fetch",
        category: "Git",
        name: "Fetch",
        description: "Fetch from specified branch",
        arguments: [
            {
                name: "branch",
                label: "Branch Name",
                type: "string",
                required: true
            }
        ],
        handler: GitService.fetchFrom,
        listTool: true
    },
    {
        id: "git.commit",
        category: "Git",
        name: "Commit",
        description: "Commit to specific branch wiht EL number & message",
        arguments: [
            {
                name: "message",
                label: "Message",
                type: "string",
                required: false
            }
        ],
        handler: GitService.commit,
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
        handler: JiraService.listIssues.bind(JiraService),
        listTool: true
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
        handler: JiraService.createIssue.bind(JiraService),
        listTool: false
    },
    // {
    //     id: "jira.listIssues",
    //     category: "Jira",
    //     name: "List Issues",
    //     description: "List Jira issues for a project",
    //     arguments: [
    //         {
    //             name: "project",
    //             label: "Project Key",
    //             type: "string",
    //             required: true
    //         }
    //     ],
    //     handler: JiraService.getStatus,
    //     listTool: false
    // }
]

export const bitbucketTools: ToolDefinition[] = [
    {   
        id: "bitbucket.createBranch",
        category: "Bitbucket",
        name: "Create Branch",
        description: "Create branch from/under spefic issue",
        arguments: [
            {
                name: "issueNumber",
                label: "Issue Number",
                type: "string",
                required: true
            }
        ],
        handler: BitbucketService.createBranch.bind(BitbucketService),
        listTool: false
    }
]