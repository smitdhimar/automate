import type {
  ToolDefinition,
  ToolResult,
} from "../types/configs/ui-configs.types/tool-configs.types.js";
import {
  gitTools,
  jiraTools,
  userInteractionTools,
  orderForTools as order,
} from "../configs/tools-configs/tools.configs.js";
import { sortToolsByOrder } from "../utils/sortTools.js";

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
        if (tool.listTool) categories.add(tool.category);
    }
    return Array.from(categories).sort();
  }

  static getTools(
    category: string,
  ): Pick<ToolDefinition, "id" | "name" | "description">[] {
    return Array.from(this.tools.values())
      .filter((t) => t.category === category && t.listTool)
      .map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        helperStr: t?.helperStr,
      }));
  }

  static getTool(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  /**
   * Returns all registered tools (including hidden ones) as full definitions.
   * Used by the AI orchestrator to build the LLM function-calling schema.
   */
  static getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  static async execute(
    id: string,
    args: Record<string, any> = {},
  ): Promise<ToolResult> {
    const tool = this.tools.get(id);
    if (!tool) {
      throw new Error(`Tool "${id}" not found`);
    }
    const result = await tool.handler(args);
    return result;
  }
}

export const registerTools = () => {
  const gitToolsSorted = sortToolsByOrder(gitTools, order?.Git);
  const jiraToolsSorted = sortToolsByOrder(jiraTools, order?.Jira);
  // const bitbucketToolsSorted = sortToolsByOrder()

  // Register menu-visible tools
  [...gitToolsSorted, ...jiraToolsSorted]?.map((tool: ToolDefinition) => {
    ToolRegistry.register(tool);
  });

  // Register hidden tools (LLM-only: user interaction tools, bitbucket tools, etc.)
  [...userInteractionTools]?.map((tool: ToolDefinition) => {
    ToolRegistry.register(tool);
  });
};
