import { UserInteractionService, UserPrompter } from "../services/business.services/user-interaction.service.js";

/**
 * A field the caller may or may not have already provided.
 * If `current` is already set, the user is not asked; otherwise the user is
 * prompted with the config value offered as a pre-filled default.
 */
export interface MissingField {
    /** Argument name — used as the key in the returned answers object. */
    name: string;
    /** Question shown to the user. */
    message: string;
    /** Value already provided by the caller — if present, the user is not asked. */
    current?: string;
    /** Pre-filled default shown to the user (e.g. the config value). */
    default?: string;
}

/**
 * Ask the user only for the fields that weren't supplied by the caller.
 * Config defaults are offered as pre-filled defaults, so the user always
 * has the final say instead of the system silently using config values.
 *
 * This works at any depth of the call chain — the active prompter is used,
 * so it behaves correctly in both the interactive menu and the AI flow
 * (and can be stubbed for non-interactive runs).
 *
 * @returns A map of field name → resolved value (current, answer, default, or "").
 */
export async function askForMissing(
    fields: MissingField[],
    prompter: UserPrompter = UserInteractionService.prompter,
): Promise<Record<string, string>> {
    const answers: Record<string, string> = {};

    for (const field of fields) {
        const provided = field.current?.trim();
        if (provided) {
            answers[field.name] = provided;
            continue;
        }

        const answer = await prompter.text(field.message, { default: field.default });
        // current > answer > default > ""
        answers[field.name] = answer?.trim() || field.default || "";
    }

    return answers;
}
