import { GitService } from "../../services/business.services/git.service.js"
import { JiraService } from "../../services/business.services/jira.service.js"
import { ConfigService } from "../../services/cli.services/config.service.js"
import { BitbucketService } from "../../services/business.services/bitbucket.service.js"
import { ToolDefinition } from "../../types/configs/ui-configs.types/tool-configs.types.js"
import { UserInteractionService } from "../../services/business.services/user-interaction.service.js"
import { CustomCommandService } from "../../services/business.services/custom-command.service.js"

const config = ConfigService.readConfig();
const defaultProject = config?.Jira?.defaultProject;
const defaultDevStream = config?.Git?.defaultDevStream;
export const gitTools: ToolDefinition[] = [
    {
        id:"git_status",
        category:"Git",
        name: "Status",
        description:"Show repository status",
        arguments: [],
        handler: GitService.status,
        listTool: true,
        helperStr: "git status"
    },
    {
        id: "git_checkout",
        category: "Git",
        name: "Checkout Branch",
        description: "Checkout a branch ( fetches if not in local )",
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
        handler: GitService.checkout,
        listTool: true,
        helperStr: "git checkout <branch-name>"

    },
    {
        id:"git_stash",
        category:"Git",
        name: "Stash",
        description:"Take a stash",
        arguments: [],
        handler: GitService.stash,
        listTool: true,
        helperStr: "git stash"
    },
    {
        id:"git_stashPop",
        category:"Git",
        name: "Stash Pop",
        description:"Stash pop",
        arguments: [],
        handler: GitService.stashPop,
        listTool: true,
        helperStr: "git stash pop"
    },
    {
        id:"git_push",
        category:"Git",
        name: "Push",
        description:"Push to current branch",
        arguments: [],
        handler: GitService.push,
        listTool: true,
        helperStr: "git push"
    },
    {
        id: "git_pull",
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
                required: true,
                default: defaultDevStream
            }
        ],
        handler: GitService.pullFrom,
        listTool: true,
        helperStr: "git pull <origin> <branch-name>"
    },
    {
        id: "git_addAll",
        category: "Git",
        name: "addAll",
        description: "Stage all changes",
        arguments:[],
        handler: GitService.addAll,
        listTool: true,
        helperStr: "git add ."
    },
    {
        id: "git_commit",
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
    {
        id: "git_branch",
        category: "Git",
        name: "Get Branch",
        description: "Get current branch name",
        arguments: [],
        handler: GitService.getBranchName,
        listTool: true,
        helperStr: "git branch --show-current"
    },
    {
        id: "git_diff",
        category: "Git",
        name: "Diff",
        description: "Show diff with color-coded output (red for removals, green for additions)",
        arguments: [
            {
                name: "target",
                label: "Target (branch or file)",
                type: "string",
                required: false
            }
        ],
        handler: GitService.diff,
        listTool: true,
        helperStr: "git diff"
    }
]

export const jiraTools: ToolDefinition[] = [
    {
        id: "jira_listIssues",
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
        id: "jira_listSubtasks",
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
        id: "jira_createSubtask",
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
    }
]

export const bitbucketTools: ToolDefinition[] = [
    {   
        id: "bitbucket_createBranch",
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

export const userInteractionTools: ToolDefinition[] = [
    {
        id: "user_confirm",
        category: "User",
        name: "Confirm",
        description: "Ask the user a yes/no confirmation question and return the answer. Use this when you need user approval before proceeding.",
        arguments: [
            {
                name: "message",
                label: "Question to ask the user",
                type: "string",
                required: true,
            },
        ],
        handler: UserInteractionService.confirm.bind(UserInteractionService),
        listTool: false,
    },
    {
        id: "user_stageFiles",
        category: "User",
        name: "Stage Files",
        description: "Prompt the user for how to stage files. Gives two options: 'Stage all files' (git add .) or 'I'll stage manually and confirm when ready'. Use this whenever files need to be staged before a commit — do NOT try to combine user_confirm + user_addAll for staging.",
        arguments: [],
        handler: UserInteractionService.stageFiles.bind(UserInteractionService),
        listTool: false,
    }
]


export const orderForTools = {
    "Git":['git_stash', 'git_addAll', 'git_commit', 'git_push', 'git_stashPop', 'git_checkout', 'git_status', 'git_pull', ],
    "Jira":['jira_createSubtask', 'jira_listIssues', 'jira_listSubtasks'],
    "Bitbucket":[]
}