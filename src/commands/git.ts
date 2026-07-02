import { Command } from "commander";
import { ActionRegistry } from "../registry/action.registry";
import { GitService } from "../services/git.service";

ActionRegistry.register(
    "git.status",
    GitService.status
);

export function registerGitCommands(program: Command) {

    const git = program.command("git");

    git
        .command("status")
        .description("Show git status")
        .action(async () => {

            await ActionRegistry.execute("git.status");

        });
}