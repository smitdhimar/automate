import fs from "fs/promises";
import path from "path";
import { ToolRegistry } from "../registry/tool.registry.js";

export class WorkflowService {

    static async execute(name: string) {

        const workflowPath = path.join(
            process.cwd(),
            "workflows",
            `${name}.json`
        );

        const file = await fs.readFile(workflowPath, "utf8");

        const actions: string[] = JSON.parse(file);

        for (const action of actions) {
            console.log(`Running ${action}`);
            const result = await ToolRegistry.execute(action);
            if (!result?.success) {
                console.error(`  ✗ Failed: ${result?.error}`);
            }
        }
    }
}