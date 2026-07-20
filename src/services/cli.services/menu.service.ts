import { ToolRegistry } from "../../registry/tool.registry.js";
import { PromptService } from "./prompt.service.js";
import { logger } from "../../utils/logger.js";
import { withLoader } from "../../utils/spinner.js";
import { ConfigService } from "./config.service.js";
import { AIOrchestrator } from "../business.services/ai-orchestrator.service.js";

const AI_CATEGORY = "askAi";

export class MenuService {

    static async start() {

        while (true) {
            // 1. Get all categories from the registry + AI Assistant
            const categories = [...ToolRegistry.getCategories(), AI_CATEGORY];

            // 2. Let user pick a category
            const selectedCategory = await PromptService.selectCategory(categories);
            if (!selectedCategory) break; // user chose exit

            // --- AI Assistant path ---
            if (selectedCategory === AI_CATEGORY) {
                const prompt = await PromptService.collectPrompt();
                if (!prompt) continue; // user went back

                try {
                    await withLoader(() => AIOrchestrator.run(prompt));
                    logger.success("AI assistant completed");
                } catch (err) {
                    logger.error(`AI assistant failed: ${err}`);
                }
                continue;
            }

            // --- Normal tool path ---
            if(!ConfigService.isServiceCredsConfigured(selectedCategory)){
                logger.warn(`No configuration found for category ${selectedCategory}. Try adding your credentials at ${ConfigService.configPath}`);
                continue;
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
                const result = await withLoader(() =>
                    ToolRegistry.execute(selectedToolId, args)
                );
                if (result?.success) {
                    logger.success(`${tool.name} completed`);
                } else {
                    logger.error(`${tool.name} failed: ${result?.error || "Unknown error"}`);
                }
            } catch (err) {
                logger.error(`${tool.name} failed: ${err}`);
            }
        }

        logger.success("Exited");
        process.exit(0);
    }
}
