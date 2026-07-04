#!/usr/bin/env node
import { registerGitTools } from "./registry/tools/git.tools.js";
import { registerJiraTools } from "./registry/tools/jira.tools.js";
import { MenuService } from "./services/menu.service.js";
import { generateResponsiveBanner } from "./utils/promptUtil.js";
import { logger } from "./utils/logger.js";

// Register all available tools
registerGitTools();
registerJiraTools();

// Show banner
logger.plain(generateResponsiveBanner("🚀 Automate"));

// Start interactive menu — everything flows through ToolRegistry
await MenuService.start();
