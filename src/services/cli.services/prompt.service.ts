import inquirer from "inquirer";
import type { ToolArgument } from "../../types/configs/ui-configs.types/tool-configs.types.js";
import { colors, Theme } from "../../configs/global-configs.js";

export class PromptService {

    static async selectCategory(categories: string[]): Promise<string | null> {
        const { category } = await inquirer.prompt([
            {
                type: "list",
                name: "category",
                message: "Select a category:",
                pageSize: 10,
                choices: [
                    ...categories.map(c => ({ name: c, value: c })),
                    new inquirer.Separator(),
                    { name: "Exit", value: null }
                ],
                theme: Theme
            }
        ]);
        return category;
    }

    static async selectTool(
        tools: { id: string; name: string; description: string; helperStr?: string }[]
    ): Promise<string | null> {
        const { toolId } = await inquirer.prompt([
            {
                type: "list",
                name: "toolId",
                message: "Select a tool:",
                pageSize: 12,
                choices: [
                    ...tools.map(t => ({
                        name: t.name,
                        value: t.id,
                        description: `${t.description}${colors?.dim} ${t?.helperStr ?? ""}`
                    })),
                    new inquirer.Separator(),
                    { name: "Back to categories", value: null }
                ],
                theme: Theme
            }
        ]);
        return toolId;
    }

    static async collectArguments(args: ToolArgument[]): Promise<Record<string, any>> {
        if (args.length === 0) return {};

        const questions = args.map(arg => ({
            type: arg.type === "boolean" ? "confirm" : "input" as const,
            name: arg.name,
            message: `${arg.label}:`,
            required: arg.required,
            validate: arg.validator
                ? (input: any) => arg.validator!(input)
                : undefined,
            theme: Theme,
            default: arg?.default
        }));

        const answers = await inquirer.prompt(questions);
        return answers;
    }

    /**
     * Collect a natural-language prompt from the user for the AI Assistant.
     * Returns null if the user provided empty input (to go back).
     */
    static async collectAnswer(question: string): Promise<string | null> {
        const { prompt } = await inquirer.prompt([
            {
                type: "input",
                name: "prompt",
                message: question,
                theme: Theme,
            },
        ]);
        return prompt?.trim() || null;
    }
}
