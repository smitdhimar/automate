export const getIssueNumberFromBranch = (branchName: String) : string => {
    return "EL-345322"
};

/**
 * Validates git add input: either a single "." or comma-separated numbers (e.g., "1,2,3" or "1, 2, 3").
 */
export const validateGitAddInput = (input: string): boolean => {
    return /^(\.|\d+(,\s*\d+)*)$/.test(input.trim());
};

/**
 * Given a comma-separated string of indices and the indexed file array from git status,
 * returns the list of matching file paths.
 */
export const getFilePathsFromIndices = (
    indicesStr: string,
    indexedFileArr: Array<{ index: number; path: string }>
): string[] => {
    const indices = indicesStr
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));

    return indices
        .map((idx) => indexedFileArr.find((f) => f.index === idx))
        .filter((f): f is { index: number; path: string } => f !== undefined)
        .map((f) => f.path);
};