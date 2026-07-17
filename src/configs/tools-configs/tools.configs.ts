import { GitService } from "../../services/business.services/git.service.js"
import { JiraService } from "../../services/business.services/jira.service.js"
import { ConfigService } from "../../services/cli.services/config.service.js"
import { BitbucketService } from "../../services/business.services/bitbucket.service.js"
import { ToolDefinition } from "../../types/configs/ui-configs.types/tool-configs.types.js"
import { JiraClient } from "../../clients/jira.client.js"

const config = ConfigService.readConfig();
const defaultProject = config?.Jira?.defaultProject;

export const gitTools: ToolDefinition[] = [
    {
        id:"git.status",
        category:"Git",
        name: "Status",
        description:"Show repository status",
        arguments: [],
        handler: GitService.status,
        listTool: true,
        helperStr: "git status"
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
        listTool: true,
        helperStr: "git checkout <branch-name>"

    },
    {
        id:"git.stash",
        category:"Git",
        name: "Stash",
        description:"Take a stash",
        arguments: [],
        handler: GitService.stash,
        listTool: true,
        helperStr: "git stash"
    },
    {
        id:"git.stashPop",
        category:"Git",
        name: "Stash Pop",
        description:"Stash pop",
        arguments: [],
        handler: GitService.stashPop,
        listTool: true,
        helperStr: "git stash pop"
    },
    {
        id:"git.push",
        category:"Git",
        name: "Push",
        description:"Push to current branch",
        arguments: [],
        handler: GitService.push,
        listTool: true,
        helperStr: "git push"
    },
    {
        id: "git.pull",
        category: "Git",
        name: "Pull",
        description: "Pull from specified origin & branch",
        arguments: [

            {
                name: "origin",
                label: "Origin",
                type: "string",
                required: false,
                default: "origin"
            },
            {
                name: "branch",
                label: "Branch Name",
                type: "string",
                required: true
            }
        ],
        handler: GitService.pullFrom,
        listTool: true,
        helperStr: "git pull <origin> <branch-name>"
    },
    {
        id: "git.fetch",
        category: "Git",
        name: "Fetch",
        description: "Fetch from specified branch",
        arguments: [
            {
                name: "origin",
                label: "Origin",
                type: "string",
                required: false,
                default: 'origin'  
            },
            {
                name: "branch",
                label: "Branch Name",
                type: "string",
                required: true
            }
        ],
        handler: GitService.fetchFrom,
        listTool: true,
        helperStr: "git fetch <origin> <branch-name>"
    },
    {
        id: "git.addAll",
        category: "Git",
        name: "addAll",
        description: "Stage all changes",
        arguments:[],
        handler: GitService.addAll,
        listTool: true,
        helperStr: "git add ."
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
        listTool: true,
        helperStr: "git commit -m \"<commit-message>\""
    },
]

export const jiraTools: ToolDefinition[] = [
    {
        id: "jira.listIssues",
        category: "Jira",
        name: "List Issues",
        description: "List Jira issues assigned to you, which are not subtask, and are in 'To Do', 'In Progress', 'Under Review', 'Assigned' statuses.",
        arguments: [
            {
                name: "project",
                label: "Project Key",
                type: "string",
                required: true,
                default: defaultProject
            }
        ],
        handler: JiraService.listIssues.bind(JiraService),
        listTool: true
    },
    {
        id: "jira.listSubtasks",
        category: "Jira",
        name: "List Subtasks",
        description: "List Jira subtasks assigned to you and are in 'To Do', 'In Progress', 'Under Review', 'Assigned' statuses.",
        arguments: [
            {
                name: "project",
                label: "Project Key",
                type: "string",
                required: true,
                default: defaultProject
            }
        ],
        handler: JiraService.listSubtasks.bind(JiraService),
        listTool: true
    },
    {
        id: "jira.createSubtask",
        category: "Jira",
        name: "Create Subtask",
        description: "Create a subtask under a parent issue with affected area, fix version, and team details.",
        arguments: [
            {
                name: "project",
                label: "Project Key",
                type: "string",
                required: true,
                default: defaultProject
            },
            {
                name: "parentIssueId",
                label: "Parent Issue ID",
                type: "string",
                required: true
            },
            {
                name: "title",
                label: "Title",
                type: "string",
                required: true
            },
            {
                name: "affectedArea",
                label: "Affected Area",
                type: "string",
                required: true
            },
            {
                name: "team",
                label: "Team",
                type: "string",
                required: true
            },
            {
                name: "description",
                label: "Description",
                type: "string",
                required: false
            },
            {
                name: "fixVersion",
                label: "Fix Version",
                type: "string",
                required: false
            }
        ],
        handler: JiraService.createSubtask.bind(JiraService),
        listTool: true
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

export const orderForTools = {
    "Git":['git.stash', 'git.addAll', 'git.commit', 'git.push', 'git.stashPop', 'git.fetch', 'git.checkout', 'git.status', 'git.pull', ],
    "Jira":['jira.createSubtask', 'jira.listIssues', 'jira.listSubtasks'],
    "Bitbucket":[]
}