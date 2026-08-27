/**
 * ── Per-service config validation schemas ─────────────────────────
 *
 * Defines which fields are REQUIRED vs OPTIONAL for each service.
 * Used by `ConfigService.isServiceCredsConfigured()` to validate only
 * the fields that actually matter for the service to function.
 *
 * A service is considered "configured" when:
 *   - All required fields are present, non-empty, and don't contain
 *     placeholder values (e.g. "your-*")
 *   - Type constraints are satisfied (e.g. `reviewers` must be array)
 *   - Optional fields are NOT checked — missing or placeholder values
 *     in optional fields do NOT fail validation.
 */

// ── Path helpers ──────────────────────────────────────────────────
// A field path uses dot notation: "selfHosted.baseUrl" means
// config[serviceName].selfHosted.baseUrl

export interface ServiceValidationSchema {
  /** Fields that must be present and filled in (no "your-" placeholders). */
  required: string[];
  /** Fields that are nice-to-have but not mandatory. */
  optional: string[];
  /** Additional type constraints beyond simple string checks. */
  typeChecks?: Record<
    string,
    { type: "array" | "boolean" }
  >;
}

export type ConfigValidationMap = Record<string, ServiceValidationSchema>;

/**
 * Validation schemas for every service.
 *
 * For hosting-based services (Jira, Bitbucket), the hosting sub-fields
 * (e.g. `selfHosted.baseUrl`) are listed as required — the validation
 * logic will dynamically check only the sub-config matching the user's
 * chosen `hosting` value.
 */
export const CONFIG_VALIDATION: ConfigValidationMap = {
  Git: {
    required: ["defaultDevStreams"],
    optional: ["commitPrefixEnabled", "gitTrackingFileExts"],
    typeChecks: {
      "defaultDevStreams": { type: "array" },
    },
  },

  Jira: {
    required: [
      "hosting",
      "defaultProject",
      "assignee",
      "affectedFunctionalArea",
      "team",
      // Hosting-dependent — only the active branch is checked
      "selfHosted.baseUrl",
      "selfHosted.apiToken",
    ],
    optional: ["defaultFixVersion", "defaultSource", "defaultSources"],
    typeChecks: {
      "defaultSources": { type: "array" },
    },
  },

  Bitbucket: {
    required: [
      "hosting",
      "selfHosted.baseUrl",
      "selfHosted.apiToken",
      "selfHosted.defaultProjectKey",
      "selfHosted.reviewers",
    ],
    optional: ["selfHosted.defaultRepoSlug", "selfHosted.defaultRepoSlugs"],
    typeChecks: {
      "selfHosted.reviewers": { type: "array" },
      "selfHosted.defaultRepoSlugs": { type: "array" },
    },
  },

  LLM: {
    required: ["apiKey"],
    optional: ["provider", "model", "baseUrl"],
  },
};
