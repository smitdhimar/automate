import type { ToolDefinition, ToolArgument } from "../types/configs/ui-configs.types/tool-configs.types.js";
import type { LLMToolDefinition, LLMParameterSchema } from "../types/llm/llm.types.js";

/**
 * Maps our internal ToolArgument.type to JSON Schema type for the LLM.
 */
function mapArgType(type: ToolArgument["type"]): LLMParameterSchema["type"] {
    switch (type) {
        case "string":
        case "select": return "string";
        case "number": return "number";
        case "boolean": return "boolean";
    }
}

/**
 * Converts an array of ToolDefinition to the OpenAI/DeepSeek function-calling format
 * consumable by the LLM chat completions API.
 */
export function convertToolsToLLMFormat(tools: ToolDefinition[]): LLMToolDefinition[] {
    return tools.map(tool => {
        const properties: Record<string, LLMParameterSchema> = {};
        const required: string[] = [];

        for (const arg of tool.arguments) {
            const schema: LLMParameterSchema = {
                type: mapArgType(arg.type),
                description: arg.label,
            };
            // Expose dropdown choices as an enum so the LLM picks from them.
            if (arg.options?.length) {
                schema.enum = arg.options;
            }
            properties[arg.name] = schema;
            if (arg.required) {
                required.push(arg.name);
            }
        }

        return {
            type: "function",
            function: {
                name: tool.id,
                description: tool.description,
                parameters: {
                    type: "object",
                    properties,
                    required,
                },
            },
        };
    });
}
