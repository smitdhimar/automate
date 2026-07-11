import type { ToolDefinition } from "../types/configs/ui-configs.types/tool-configs.types.js";
import { gitTools, jiraTools } from "../configs/tools-configs/tools.configs.js";

export class ToolRegistry {

    private static tools = new Map<string, ToolDefinition>();

    static register(tool: ToolDefinition) {
        if (this.tools.has(tool.id)) {
            throw new Error(`Tool "${tool.id}" is already registered`);
        }
        this.tools.set(tool.id, tool);
    }

    static getCategories(): string[] {
        const categories = new Set<string>();
        for (const tool of this.tools.values()) {
            categories.add(tool.category);
        }
        return Array.from(categories).sort();
    }

    static getTools(category: string): Pick<ToolDefinition, "id" | "name" | "description">[] {
        return Array.from(this.tools.values())
            .filter(t => t.category === category)
            .map(t => ({ id: t.id, name: t.name, description: t.description }));
    }

    static getTool(id: string): ToolDefinition | undefined {
        return this.tools.get(id);
    }

    static async execute(id: string, args: Record<string, any> = {}): Promise<void> {
        const tool = this.tools.get(id);
        if (!tool) {
            throw new Error(`Tool "${id}" not found`);
        }
        await tool.handler(args);
    }
}

export const registerTools=() => {
    [...gitTools, ...jiraTools]?.map((tool: ToolDefinition)=>{
        if(tool.listTool){
            ToolRegistry.register(tool);
        }
    })
}