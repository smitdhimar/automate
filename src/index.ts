#!/usr/bin/env node
import { MenuService } from "./services/menu.service.js";
import { generateResponsiveBanner } from "./utils/promptUtil.js";
import { logger } from "./utils/logger.js";
import { registerTools } from "./registry/tool.registry.js";

// Register all available tools
registerTools();

// Show banner
logger.plain(generateResponsiveBanner("🚀 Automate"));

// Start interactive menu — everything flows through ToolRegistry
await MenuService.start();
