import { ToolRegistry } from "../registry/tool.registry.js";
import { PromptService } from "./prompt.service.js";
import { logger } from "../utils/logger.js";
import { withLoader } from "../utils/spinner.js";
import { ConfigService } from "./config.service.js";

export class MenuService {

    static async start() {

        while (true) {
            // 1. Get all categories from the registry
            const categories = ToolRegistry.getCategories();

            // 2. Let user pick a category
            const selectedCategory = await PromptService.selectCategory(categories);
            if (!selectedCategory) break; // user chose exit

            if(!ConfigService.isServiceCredsConfigured(selectedCategory)){
                logger.warn("No configuration found for category ", selectedCategory);
                break;
            }
            // 3. Get tools for the selected category
            const tools = ToolRegistry.getTools(selectedCategory);

            // 4. Let user pick a tool
            const selectedToolId = await PromptService.selectTool(tools);
            if (!selectedToolId) continue; // user chose go back

            // 5. Get full tool definition
            const tool = ToolRegistry.getTool(selectedToolId)!;

            // 6. Collect arguments from user
            const args = await PromptService.collectArguments(tool.arguments);

            // 7. Execute with loading spinner
            try {
                await withLoader(() =>
                    ToolRegistry.execute(selectedToolId, args)
                );
                logger.success(`${tool.name} completed`);
            } catch (err) {
                logger.error(`${tool.name} failed: ${err}`);
            }
        }

        logger.success("Exited");
        process.exit(0);
    }
}
