import { Command } from "commander";
import { WorkflowService } from "../services/workflow.service.js";

export function registerWorkflowCommands(program: Command) {

    program
        .command("workflow")
        .argument("<name>")
        .description("Execute a workflow")
        .action(async (name) => {

            await WorkflowService.execute(name);

        });
}