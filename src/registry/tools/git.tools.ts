import { ToolRegistry } from "../tool.registry.js";
import { GitService } from "../../services/git.service.js";

export function registerGitTools() {
    ToolRegistry.register({
        id: "git.status",
        category: "Git",
        name: "Status",
        description: "Show repository status",
        arguments: [],
        handler: GitService.status
    });

    ToolRegistry.register({
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
        handler: GitService.checkout
    });
}
