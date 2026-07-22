import { logger } from "../../utils/logger.js";
import { ToolResult } from "../../types/configs/ui-configs.types/tool-configs.types.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";

// Promisify exec so it can be awaited
const execAsync = promisify(exec);

export class CustomCommandService {
    static async execute(args: Record<string, any>): Promise<ToolResult> {
        try {
            // execAsync resolves with an object containing { stdout, stderr }
            const { stdout, stderr } = await execAsync(args?.command);

            const result = stdout.trim();
            
            logger.plain(`\n${result}`)

            return { success: true, data: { result } };
        } catch (e: any) {
            logger.error(`\n${e.message}`)
            return { success: false, error: e?.message };
        }
    }
}