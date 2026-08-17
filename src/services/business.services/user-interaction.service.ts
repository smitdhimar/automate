import inquirer from "inquirer";
import type { ToolResult } from "../../types/configs/ui-configs.types/tool-configs.types.js";
import { GitService } from "./git.service.js";
import { logger } from "../../utils/logger.js";
import { Theme } from "../../configs/global-configs.js";

/**
 * Abstraction over "ask the user for input".
 *
 * Any handler — no matter how deep in a service-to-service call chain —
 * can request user input through the active prompter without knowing
 * whether it is running in the interactive menu, the AI orchestrator, or a
 * non-interactive session (where a stub prompter can auto-answer).
 */
export interface UserPrompter {
    /** Free-form text input. Returns the trimmed value, or null if cancelled/empty. */
    text(message: string, opts?: { default?: string }): Promise<string | null>;
    /** Single-choice selection. Returns the chosen value, or null if cancelled. */
    select(message: string, choices: Array<string | { name: string; value: string }>, opts?: { default?: string }): Promise<string | null>;
    /** Yes/no confirmation. Returns the boolean, or null if cancelled. */
    confirm(message: string, opts?: { default?: boolean }): Promise<boolean | null>;
}

/**
 * Default blocking prompter backed by inquirer. Works in a terminal for both
 * the interactive menu and the AI orchestrator loop.
 */
export class InquirerPrompter implements UserPrompter {
    async text(message: string, opts?: { default?: string }): Promise<string | null> {
        const { value } = await inquirer.prompt<{ value: string }>([
            {
                type: "input",
                name: "value",
                message,
                default: opts?.default,
                theme: Theme,
            },
        ]);
        return value?.trim() || null;
    }

    async select(message: string, choices: Array<string | { name: string; value: string }>, opts?: { default?: string }): Promise<string | null> {
        const { value } = await inquirer.prompt<{ value: string }>([
            {
                type: "list",
                name: "value",
                message,
                choices,
                default: opts?.default,
                theme: Theme,
            },
        ]);
        return value ?? null;
    }

    async confirm(message: string, opts?: { default?: boolean }): Promise<boolean | null> {
        const { value } = await inquirer.prompt<{ value: boolean }>([
            {
                type: "confirm",
                name: "value",
                message,
                default: opts?.default ?? true,
                theme: Theme,
            },
        ]);
        return value ?? null;
    }
}

export class UserInteractionService {

    private static _prompter: UserPrompter | null = null;
    private static _defaultPrompter = new InquirerPrompter();

    /**
     * Override the prompter used for the current run (e.g. a non-interactive
     * stub for tests/CI). Pass null to restore the default inquirer prompter.
     */
    static setPrompter(prompter: UserPrompter | null): void {
        this._prompter = prompter;
    }

    /**
     * The active prompter for the current run.
     */
    static get prompter(): UserPrompter {
        return this._prompter ?? this._defaultPrompter;
    }

    /**
     * Generic free-form text prompt. Returns the trimmed answer, or null if
     * the user provided empty input.
     */
    static async askText(message: string, opts?: { default?: string }): Promise<string | null> {
        return this.prompter.text(message, opts);
    }

    /**
     * Generic single-choice prompt.
     */
    static async askSelect(message: string, choices: Array<string | { name: string; value: string }>, opts?: { default?: string }): Promise<string | null> {
        return this.prompter.select(message, choices, opts);
    }

    /**
     * Generic yes/no prompt.
     */
    static async askConfirm(message: string, opts?: { default?: boolean }): Promise<boolean | null> {
        return this.prompter.confirm(message, opts);
    }

    /**
     * Pauses execution and prompts the user with a confirmation question.
     * Used by the LLM orchestrator to ask the user mid-workflow
     * (e.g., "Have you staged your files?").
     */
    static async confirm(args: { message: string }): Promise<ToolResult> {
        const confirmed = await this.askConfirm(args.message || "Continue?", { default: true });
        return { success: true, data: { confirmed: confirmed ?? false } };
    }

    /**
     * Prompts the user with two staging options:
     * 1. Stage all files (git add .)
     * 2. Stage files manually and confirm when ready
     *
     * Used by the LLM orchestrator when files need to be staged before committing.
     */
    static async stageFiles(): Promise<ToolResult> {
        const method = await this.askSelect(
            "Files need to be staged before committing. How would you like to proceed?",
            [
                { name: "Stage all files (git add .)", value: "all" },
                { name: "I'll stage files manually and confirm when ready", value: "manual" },
            ],
        );

        if (method === "all") {
            logger.info("Staging files...");
            const result = await GitService.add();
            if (!result.success) {
                return { success: false, error: `Failed to stage files: ${result.error}` };
            }
            return { success: true, data: { method: "all", staged: true } };
        }

        // Manual staging: wait for user confirmation
        const ready = await this.askConfirm(
            "Have you staged your files? Confirm to proceed with commit.",
            { default: false },
        );
        if (!ready) {
            return { success: false, error: "User cancelled — files were not staged." };
        }

        return { success: true, data: { method: "manual", staged: true } };
    }
}
