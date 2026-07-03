// import { Command } from "commander";
// import { ActionRegistry } from "../registry/action.registry.js";
// // import { GitService } from "../services/git.service.js";

// ActionRegistry.register(
//     "git.status",
//     GitService.status
// );

// export function registerGitCommands(program: Command) {

//     const git = program.command("git");

//     git
//         .command("status")
//         .description("Show git status")
//         .action(async () => {

//             await ActionRegistry.execute("git.status");

//         });
// }