/**
 * Resolve a config value that may be a legacy single string or the new
 * array format.
 *
 * Arrays drive the dropdown choices; a non-placeholder legacy string is used
 * as a fallback for backward compatibility. Placeholder values copied from the
 * config template (e.g. "your-repo-slug") are filtered out so they never show
 * up as dropdown choices or defaults.
 */
export function resolveList(arr: unknown, legacy: unknown): string[] {
    const list = Array.isArray(arr)
        ? arr.filter((v): v is string => typeof v === "string" && v.trim() !== "" && !v.includes("your-"))
        : [];
    if (list.length) return list;
    return typeof legacy === "string" && legacy.trim() !== "" && !legacy.includes("your-")
        ? [legacy]
        : [];
}
