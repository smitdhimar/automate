import fs from "fs";
import path from "path";
import os from "os";
import { logger } from "../utils/logger.js";
import { colors } from "../configs/global-configs.js";
import { DEFAULT_CONFIG } from "../configs/client-configs/config-template.js";

const CONFIG_DIR = path.join(os.homedir(), ".automate");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export class ConfigService {
  /**
   * Path to the config file on disk
   */
  static get configPath(): string {
    return CONFIG_PATH;
  }

  /**
   * Path to the config directory on disk
   */
  static get configDir(): string {
    return CONFIG_DIR;
  }

  /**
   * Check if the config file exists on disk
   */
  static configExists(): boolean {
    return fs.existsSync(CONFIG_PATH);
  }

  /**
   * Read and parse the config file
   */
  static readConfig(): Record<string, any> | null {
    try {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Check whether the config has been filled in by the user
   * (i.e. default placeholders have been replaced)
   */
  static isConfigFileCreated(): boolean {
    if (!this.configExists()) return false;

    const config = this.readConfig();
    if (!config) return false;

    return true;
  }

  /**
   * Check whether the config file has been created and a particular
   * service's credentials are configured (based on its hosting type).
   */

  static isServiceCredsConfigured(serviceName: string): boolean {
    if (!ConfigService.isConfigFileCreated()) {
      return false;
    }

    const defaults = (DEFAULT_CONFIG as Record<string, any>)[serviceName];
    if (!defaults) return true; // unknown service

    const config = this.readConfig();
    const userSection = config?.[serviceName];
    if (!userSection || typeof userSection !== "object") return false;

    // 1. Check that "hosting" is set to a valid value
    const hosting: string | undefined = userSection.hosting;
    if (hosting !== "cloud" && hosting !== "self-hosted") return false;

    // 2. Check that the relevant sub-config is filled in
    const section = userSection[hosting];
    if (!section || typeof section !== "object") return false;

    const defaultSection = defaults[hosting] as Record<string, string>;
    for (const key of Object.keys(defaultSection)) {
      const val: string | undefined = section[key];
      const defaultVal: string = defaultSection[key];
      if (!val || val === defaultVal || val.includes("your-")) {
        return false;
      }
    }

    return true;
  }
  /**
   * Create the config directory and a starter config file.
   * Returns true if created, false if it already existed.
   */
  static createDefaultConfig(): boolean {
    if (this.configExists()) return false;

    // Create directory (recursive)
    fs.mkdirSync(CONFIG_DIR, { recursive: true });

    // Write default config with helpful comments as JSON
    const configWithGuide = {
      _instructions: "Edit this file with your actual credentials and settings.",
      ...DEFAULT_CONFIG,
      _note: "Replace all 'your-*' values with your real configuration.",
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(configWithGuide, null, 2), "utf-8");
    return true;
  }

  /**
   * Display a setup prompt to the user telling them where the config file is.
   */
  static showSetupPrompt(): void {
    const { bold, cyan, yellow, dim, reset } = colors;

    console.log("");
    logger.warn("First-time setup required!");
    console.log("");
    console.log(`  A configuration file has been created at:`);
    console.log(`  ${cyan}${CONFIG_PATH}${reset}`);
    console.log("");
    console.log(`  ${yellow}Please:${reset}`);
    console.log(`    1. Open the file:  ${cyan}code ${CONFIG_PATH}${reset}`);
    console.log(`    2. Fill in your ${bold}Jira${reset}, ${bold}Bitbucket${reset}, and ${bold}Git${reset} credentials`);
    console.log(`    3. Save the file`);
    console.log(`    4. Run ${cyan}automate${reset} again`);
    console.log("");
    console.log(`  ${dim}You can also use any text editor to edit the file.${reset}`);
    console.log("");
    process.exit(0);
  }

  /**
   * Main initialisation — call once at startup.
   * - If config doesn't exist → create it, show prompt, exit.
   * - If config exists but is not configured → show prompt, exit.
   * - If config exists and is configured → silent success, continue.
   */
  static init(): void {
    const created = this.createDefaultConfig();

    if (created || !this.isConfigFileCreated()) {
      this.showSetupPrompt();
    }
  }
}