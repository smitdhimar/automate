#!/usr/bin/env node

import inquirer from "inquirer";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8")
);

function showBanner(): void {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║                     🚀 automate                           ║
║                         v${pkg.version.padEnd(25)}║
║     Your command center for Jira, Bitbucket, Git ops      ║
║              and day-to-day development workflows         ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
}

async function showMainMenu(): Promise<void> {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      pageSize: 8,
      choices: [
        { name: "🔄  Git Operations", value: "git" },
        { name: "📋  Jira Operations", value: "jira" },
        { name: "🔧  Bitbucket Operations", value: "bitbucket" },
        { name: "📦  Run a Workflow", value: "workflow" },
        { name: "⚙️   Settings", value: "settings" },
        { name: "🚪  Exit", value: "exit" },
      ],
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
    case "workflow":
      console.log("\n📦 Workflow execution coming soon!\n");
      break;
    case "settings":
      console.log("\n⚙️  Settings coming soon!\n");
      break;
    case "exit":
      console.log("\n👋 Goodbye!\n");
      process.exit(0);
  }

  const { continue: keepGoing } = await inquirer.prompt([
    {
      type: "confirm",
      name: "continue",
      message: "Go back to main menu?",
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
    console.log(`
  Usage: automate

  An interactive CLI tool for Jira, Bitbucket, Git ops, and workflows.

  Options:
    -h, --help      Show help
    -v, --version   Show version

  Run without arguments to launch the interactive menu.
    `);
    return;
  }

  showBanner();
  await showMainMenu();
}

main().catch(console.error);
