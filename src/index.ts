#!/usr/bin/env node

import inquirer from "inquirer";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { navigation, pageSize, Theme } from "./configs/global-configs.js";
import {
  banner,
  exitChoice,
  goBackToMenu,
  mainChoices,
  mainMenuQestion,
  usageText,
} from "./configs/ui-configs/ui-configs.js";
import { logger } from "./utils/logger.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
);

function showBanner(): void {
  logger.plain(banner);
}

async function showMainMenu(): Promise<void> {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: mainMenuQestion,
      pageSize: pageSize,
      choices: [...mainChoices, new inquirer.Separator(), exitChoice],
      instructions: navigation,
      theme: Theme,
    },
  ]);

  switch (action) {
    case "git":
      console.log("\n🔧 Git operations coming soon!\n");
      break;
    case "jira":
      console.log("\n📋 Jira operations coming soon!\n");
      break;
    case "bitbucket":
      console.log("\n🔧 Bitbucket operations coming soon!\n");
      break;
    case "workflows":
      console.log("\n📦 Workflow execution coming soon!\n");
      break;
    case "settings":
      console.log("\n⚙️  Settings coming soon!\n");
      break;
    case "exit":
      logger.success("Existed successfullly");
      process.exit(0);
  }

  const { continue: keepGoing } = await inquirer.prompt([
    {
      type: "confirm",
      name: "continue",
      message: goBackToMenu,
      default: true,
    },
  ]);

  if (keepGoing) {
    await showMainMenu();
  } else {
    console.log("\n👋 Goodbye!\n");
    process.exit(0);
  }
}

async function main(): Promise<void> {

  // Direct command mode via --flag or subcommand can be added here later
  if (process.argv.length > 2) {
    // If arguments are passed, show help for now
    logger.plain(usageText);
    return;
  }

  showBanner();
  await showMainMenu();
}

main().catch(console.error);
