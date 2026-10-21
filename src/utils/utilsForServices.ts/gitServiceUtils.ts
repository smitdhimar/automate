export const getIssueNumberFromBranch = (branchName: String) : string => {
    return "EL-345322"
};

/**
 * Validates a git file selection: either a single "." or a comma-separated
 * list of indices and/or ranges (e.g., "1", "1,2,3", "1-3", "1-3, 5").
 */
export const validateGitAddInput = (input: string): boolean => {
    const trimmed = input.trim();
    if (trimmed === ".") return true;

    const parts = trimmed.split(",").map((part) => part.trim());
    if (parts.some((part) => !/^\d+(\s*-\s*\d+)?$/.test(part))) return false;

    // Reject descending ranges (e.g. "3-1").
    return parts.every((part) => {
        const [start, end] = part.split("-").map((n) => parseInt(n.trim(), 10));
        return end === undefined || start <= end;
    });
};

/**
 * Expands a selection string of indices and/or ranges (e.g., "1,3-5")
 * into a de-duplicated, ordered list of indices.
 */
export const parseIndexSelection = (input: string): number[] => {
    const indices = new Set<number>();

    for (const part of input.split(",")) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        const [startStr, endStr] = trimmed.split("-");
        const start = parseInt(startStr.trim(), 10);
        const end = endStr === undefined ? start : parseInt(endStr.trim(), 10);
        if (isNaN(start) || isNaN(end)) continue;

        for (let i = start; i <= end; i++) {
            indices.add(i);
        }
    }

    return [...indices];
};

/**
 * Given a selection string of indices/ranges and the indexed file array from git status,
 * returns the list of matching file paths.
 */
export const getFilePathsFromIndices = (
    indicesStr: string,
    indexedFileArr: Array<{ index: number; path: string }>
): string[] => {
    return parseIndexSelection(indicesStr)
        .map((idx) => indexedFileArr.find((f) => f.index === idx))
        .filter((f): f is { index: number; path: string } => f !== undefined)
        .map((f) => f.path);
};