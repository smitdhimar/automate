#!/usr/bin/env node
import { ConfigService } from "./services/config.service.js";
import { MenuService } from "./services/menu.service.js";
import { generateResponsiveBanner } from "./utils/promptUtil.js";
import { logger } from "./utils/logger.js";
import { registerTools } from "./registry/tool.registry.js";

// ── First-time setup ─────────────────────────────────────────────
// If config is missing or unconfigured, this creates the file and
// prints instructions, then exits. On subsequent runs it's a no-op.
ConfigService.init();

// Register all available tools
registerTools();

// Show banner
logger.plain(generateResponsiveBanner("🚀 Automate"));

// Start interactive menu — everything flows through ToolRegistry
await MenuService.start();
