import { ToolDefinition } from "../types/configs/ui-configs.types/tool-configs.types.js";

/**
 * Sort an array of tools based on a custom order of tool IDs.
 * Tools whose IDs are not in the order list are placed at the end,
 * preserving their original relative order.
 */
export function sortToolsByOrder<T extends ToolDefinition>(tools: T[], order: string[]): T[] {
    const orderMap = new Map(order.map((id, index) => [id, index]));
    return [...tools].sort((a, b) => {
        const aIdx = orderMap.get(a.id);
        const bIdx = orderMap.get(b.id);
        if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
        if (aIdx !== undefined) return -1;
        if (bIdx !== undefined) return 1;
        return 0;
    });
}