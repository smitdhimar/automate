import inquirer from "inquirer";
import type { ToolArgument } from "../types/configs/ui-configs.types/tool-configs.types.js";
import { Theme } from "../configs/global-configs.js";

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
        tools: { id: string; name: string; description: string }[]
    ): Promise<string | null> {
        const { toolId } = await inquirer.prompt([
            {
                type: "list",
                name: "toolId",
                message: "Select a tool:",
                pageSize: 10,
                choices: [
                    ...tools.map(t => ({
                        name: t.name,
                        value: t.id,
                        description: t.description
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
            theme: Theme
        }));

        const answers = await inquirer.prompt(questions);
        return answers;
    }
}
