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

        // Questions are built dynamically from tool definitions. inquirer's
        // `prompt` expects a discriminated union keyed on the literal `type`
        // ("input" | "confirm" | "list" | …), which a `.map()` can't infer
        // (it widens `type` to `string`). Build the list loosely and let
        // inquirer validate.
        const questions: any[] = args.map(arg => {
            // Dropdown (select) arguments: offer the config values as choices.
            // Falls back to free-text input when no options are configured.
            if (arg.type === "select" && arg.options?.length) {
                const choices = [
                    ...new Set([
                        ...(arg.default && !arg.options.includes(arg.default) ? [arg.default] : []),
                        ...arg.options,
                    ]),
                ];
                return {
                    type: "list",
                    name: arg.name,
                    message: `${arg.label}:`,
                    choices,
                    pageSize: 10,
                    theme: Theme,
                    default: arg.default && choices.includes(arg.default) ? arg.default : choices[0],
                };
            }
            return {
                type: arg.type === "boolean" ? "confirm" : "input" as const,
                name: arg.name,
                message: `${arg.label}:`,
                required: arg.required,
                validate: arg.validator
                    ? (input: any) => arg.validator!(input)
                    : undefined,
                theme: Theme,
                default: arg?.default
            };
        });

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
