import fs from "fs";
import path from "path";
import os from "os";
import { DEFAULT_CONFIG } from "../../configs/client-configs/config-template.js";
import { CONFIG_VALIDATION } from "../../configs/client-configs/config-validation.js";
import { printSetupPromptUtil } from "../../utils/utilsForServices.ts/configServiceUtils.js";

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
   * service's credentials are configured.
   *
   * Validation uses {@link CONFIG_VALIDATION} schemas — only fields
   * marked as `required` are checked; optional fields are skipped.
   *
   * For hosting-based services (Jira, Bitbucket):
   *   - `hosting` must be valid ("cloud" or "selfHosted")
   *   - Only required fields under the *active* hosting sub-config are checked
   *
   * @param serviceName — "Git", "Jira", "Bitbucket", or "LLM"
   */

  static isServiceCredsConfigured(serviceName: string): boolean {
    if (!ConfigService.isConfigFileCreated()) {
      return false;
    }

    const config = this.readConfig();
    const userSection = config?.[serviceName];
    if (!userSection || typeof userSection !== "object") return false;

    const schema = CONFIG_VALIDATION[serviceName];
    if (!schema) return true; // unknown service — assume OK

    // ── hosting check (for hosting-based services) ─────────────
    const hosting: string | undefined = userSection.hosting;
    const isHostingBased = hosting === "cloud" || hosting === "selfHosted";

    // ── validate each required field ───────────────────────────
    for (const fieldPath of schema.required) {
      const parts = fieldPath.split(".");
      const firstPart = parts[0];

      // Is this a hosting-dependent field? (e.g. "selfHosted.baseUrl")
      if (parts.length > 1) {
        // If the first part matches the active hosting, validate it
        if (firstPart === hosting) {
          const subSection = userSection[firstPart];
          if (!subSection || typeof subSection !== "object") return false;

          const subPath = parts.slice(1).join(".");
          // Pass the full field path for type-check resolution
          if (!this.isFieldValid(subSection, subPath, schema, fieldPath)) return false;
        }
        // If it doesn't match the active hosting, skip it
        // (e.g. "cloud.site" when hosting is "selfHosted")
        continue;
      }

      // Top-level field (no dot) — always validate
      if (!this.isFieldValid(userSection, fieldPath, schema)) return false;
    }

    // ── hosting must be valid for hosting-based services ───────
    if (schema.required.includes("hosting") && !isHostingBased) {
      return false;
    }

    return true;
  }

  /**
   * Validate a single field value against the schema.
   * - Must exist and be non-null / non-undefined
   * - Must not contain the "your-" placeholder prefix
   * - Must satisfy any type constraint defined in the schema
   *
   * @param section     — The object containing the field (e.g. the hosting sub-config)
   * @param fieldName   — Key to look up in `section` (e.g. "reviewers")
   * @param schema      — The service's validation schema
   * @param fullPath    — Full dotted path (e.g. "selfHosted.reviewers") for
   *                      type-check resolution. Falls back to `fieldName` if omitted.
   */
  private static isFieldValid(
    section: Record<string, any>,
    fieldName: string,
    schema: import("../../configs/client-configs/config-validation.js").ServiceValidationSchema,
    fullPath?: string,
  ): boolean {
    const val = section[fieldName];

    // Must exist
    if (val === undefined || val === null) return false;

    // Type check — use the full dotted path when available
    const typeCheckKey = fullPath ?? fieldName;
    const typeCheck = schema.typeChecks?.[typeCheckKey];
    if (typeCheck?.type === "array") {
      if (!Array.isArray(val)) return false;
      // Array is valid even if empty — we just need the shape right
    }

    // String placeholder check
    if (typeof val === "string") {
      if (val.trim() === "") return false;
      if (val.includes("your-")) return false;
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
   * Deep-merge missing keys from {@link DEFAULT_CONFIG} into the user's
   * existing `config.json`. User values are **never overwritten** — only
   * keys that are absent from the user's config are added.
   *
   * This ensures that when the package is upgraded and new keys are added
   * to the template, they appear in the user's config without deleting or
   * modifying existing settings.
   *
   * Should be called on every startup after {@link createDefaultConfig}.
   *
   * @returns `true` if any new keys were added, `false` otherwise.
   */
  static deepMergeConfig(): boolean {
    if (!this.configExists()) return false;

    const existing = this.readConfig();
    if (!existing) return false;

    const { merged, changed } = this.deepMergeDefaults(
      DEFAULT_CONFIG as Record<string, any>,
      existing,
    );

    // Preserve meta fields that are not part of DEFAULT_CONFIG
    if (existing._instructions) merged._instructions = existing._instructions;
    if (existing._note) merged._note = existing._note;

    if (changed) {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), "utf-8");
    }

    return changed;
  }

  /**
   * Recursively merge `defaults` into `target`, returning the merged
   * object and whether any changes were made.
   *
   * - Missing keys in `target` are added from `defaults` (deep-cloned)
   * - Existing keys in `target` are preserved (never overwritten)
   * - Arrays and primitives are treated as leaf values
   */
  private static deepMergeDefaults(
    defaults: Record<string, any>,
    target: Record<string, any>,
  ): { merged: Record<string, any>; changed: boolean } {
    let changed = false;
    const result: Record<string, any> = { ...target };

    for (const key of Object.keys(defaults)) {
      if (!(key in result)) {
        // Key missing → add default (deep clone to avoid mutation)
        result[key] = JSON.parse(JSON.stringify(defaults[key]));
        changed = true;
      } else if (
        typeof defaults[key] === "object" &&
        defaults[key] !== null &&
        !Array.isArray(defaults[key]) &&
        typeof result[key] === "object" &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        // Both are plain objects → recurse
        const nested = this.deepMergeDefaults(defaults[key], result[key]);
        result[key] = nested.merged;
        if (nested.changed) changed = true;
      }
      // Otherwise (primitive or array mismatch) → keep target value
    }

    return { merged: result, changed };
  }

  /**
   * Display a setup prompt to the user telling them where the config file is.
   */
  static showSetupPrompt(): void {
    printSetupPromptUtil(CONFIG_PATH);
    process.exit(0);
  }

  /**
   * Main initialisation — call once at startup.
   * - If config doesn't exist → create it, show prompt, exit.
   * - If config exists → deep-merge any new keys from DEFAULT_CONFIG,
   *   then check if services are configured. If entirely unconfigured
   *   (all placeholders), show prompt and exit.
   * - If config exists and is configured → silent success, continue.
   */
  static init(): void {
    const created = this.createDefaultConfig();

    if (created) {
      this.showSetupPrompt();
    }

    // Config exists — merge any new keys from the latest DEFAULT_CONFIG
    // so version upgrades propagate new template keys automatically.
    this.deepMergeConfig();

    // If none of the services are configured, show the setup prompt.
    const services = ["LLM", "Jira", "Bitbucket", "Git"];
    const anyConfigured = services.some((svc) => this.isServiceCredsConfigured(svc));

    if (!anyConfigured) {
      this.showSetupPrompt();
    }
  }
}