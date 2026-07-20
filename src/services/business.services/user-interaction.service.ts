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
     * Auto-stages all files via `git add .`.
     * Alternative to user manually staging and confirming.
     */
    static async addAll(): Promise<ToolResult> {
        logger.info("Staging all files...");
        return await GitService.addAll();
    }
}
