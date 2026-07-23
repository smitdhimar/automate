import inquirer from "inquirer";
import type { ToolResult } from "../../types/configs/ui-configs.types/tool-configs.types.js";
import { GitService } from "./git.service.js";
import { logger } from "../../utils/logger.js";

export class UserInteractionService {

    /**
     * Pauses execution and prompts the user with a confirmation question.
     * Used by the LLM orchestrator to ask the user mid-workflow
     * (e.g., "Have you staged your files?").
     */
    static async confirm(args: { message: string }): Promise<ToolResult> {
        const { confirmed } = await inquirer.prompt([
            {
                type: "confirm",
                name: "confirmed",
                message: args.message || "Continue?",
                default: true,
            },
        ]);

        return { success: true, data: { confirmed } };
    }

    /**
     * Prompts the user with two staging options:
     * 1. Stage all files (git add .)
     * 2. Stage files manually and confirm when ready
     *
     * Used by the LLM orchestrator when files need to be staged before committing.
     */

    // refator stagefiles function. 
    static async stageFiles(): Promise<ToolResult> {
        const { method } = await inquirer.prompt([
            {
                type: "list",
                name: "method",
                message: "Files need to be staged before committing. How would you like to proceed?",
                choices: [
                    { name: "Stage all files (git add .)", value: "all" },
                    { name: "I'll stage files manually and confirm when ready", value: "manual" },
                ],
            },
        ]);

        if (method === "all") {
            logger.info("Staging files...");
            const result = await GitService.add();
            if (!result.success) {
                return { success: false, error: `Failed to stage files: ${result.error}` };
            }
            return { success: true, data: { method: "all", staged: true } };
        }

        // Manual staging: wait for user confirmation
        const { ready } = await inquirer.prompt([
            {
                type: "confirm",
                name: "ready",
                message: "Have you staged your files? Confirm to proceed with commit.",
                default: false,
            },
        ]);

        if (!ready) {
            return { success: false, error: "User cancelled — files were not staged." };
        }

        return { success: true, data: { method: "manual", staged: true } };
    }
}
