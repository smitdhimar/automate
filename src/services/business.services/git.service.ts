import { simpleGit, StatusResult } from "simple-git";
import { logger } from "../../utils/logger.js";
import type { ToolResult } from "../../types/configs/ui-configs.types/tool-configs.types.js";
import { ConfigService } from "../cli.services/config.service.js";
import { UserInteractionService } from "./user-interaction.service.js";
import { validateGitAddInput, getFilePathsFromIndices } from "../../utils/utilsForServices.ts/gitServiceUtils.js";
import { colors } from "../../configs/global-configs.js";

const git = simpleGit();
const configs = ConfigService.readConfig();

export class GitService {
    
    // gets the status of repo
    static async status(_args?: Record<string, any>): Promise<ToolResult> {
        try {
            const trackingFileExts = configs?.Git?.gitTrackingFileExts;
            let limitedTracking = false;

            if( trackingFileExts && Array.isArray(trackingFileExts) ){
                limitedTracking = true;
            }
            const response:StatusResult = await git.status();
            const indexedFileArr = response?.files
            ?.filter( (fileStatusSummary) => 
            {
                // if limited Tracking enabled, then only track specified file extensions 
                if(limitedTracking && !trackingFileExts.includes(fileStatusSummary?.path?.split('.')?.pop())){
                    return false;
                }
                return true;
            }
            )
            ?.map( (fileStatusSummary, index) => { 
                // return index & path
                return ({ index: index+1, path: fileStatusSummary?.path })
            });

            logger.plain(indexedFileArr);
            return { success: true, data: { indexedFileArr } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
    
    // checks out to specified branch
    static async checkout(args: { branch: string, origin?: string }): Promise<ToolResult> {
        try {
            // Only stash when the working tree actually has changes.
            const stashRes = await GitService.stashIfDirty();
            if (stashRes.result && !stashRes.result.success) {
                return { success: false, error: `Failed to stash changes before checkout: ${stashRes.result.error}` };
            }

            try {
                const result = await git.branch();
                const branches = result?.all;
                if(!branches.includes(args.branch)){
                    await git.fetch(args.origin || 'origin', args.branch);
                }
                const checkoutResponse = await git.checkout(args.branch);

                logger.plain(checkoutResponse);
            } catch (e: any) {
                // Restore the stashed changes even if the checkout failed.
                const restore = await GitService.popIfStashed(stashRes);
                return { success: false, error: restore.error ? `${e.message} (also failed to restore stash: ${restore.error})` : e.message };
            }

            // Restore the stashed changes after checkout (skipped when clean).
            const stashPopRes = await GitService.popIfStashed(stashRes);

            return {
                success: true,
                data: {
                    branch: args.branch,
                    stash: stashRes.data,
                    stashPop: stashPopRes.data,
                },
            };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
    
    // pull from specific origin branch
    static async pullFrom(args: { branch: string, origin?: string }): Promise<ToolResult> {
        try {
            // Only stash when the working tree actually has changes.
            const stashRes = await GitService.stashIfDirty();
            if (stashRes.result && !stashRes.result.success) {
                return { success: false, error: `Failed to stash changes before pull: ${stashRes.result.error}` };
            }

            let response;
            try {
                response = await git.pull(args.origin || 'origin', args.branch);
                logger.plain(response);
            } catch (e: any) {
                // Restore the stashed changes even if the pull failed.
                const restore = await GitService.popIfStashed(stashRes);
                return { success: false, error: restore.error ? `${e.message} (also failed to restore stash: ${restore.error})` : e.message };
            }

            // Restore the stashed changes after pull (skipped when clean).
            const stashPopRes = await GitService.popIfStashed(stashRes);

            return {
                success: true,
                data: {
                    summary: response.summary,
                    stash: stashRes.data,
                    stashPop: stashPopRes.data,
                },
            };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    // Stash only if the working tree is dirty; reports whether a stash was taken.
    private static async stashIfDirty(): Promise<{ stashed: boolean; data: any; result?: ToolResult }> {
        const isClean = await GitService.isClean();
        if (isClean) {
            return { stashed: false, data: { skipped: true, reason: "working tree clean" } };
        }

        const result = await GitService.stash();
        return { stashed: true, data: result.data, result };
    }

    // Pop the stash only when one was taken; reports a skip otherwise.
    private static async popIfStashed(stash: { stashed: boolean }): Promise<{ data: any; error?: string }> {
        if (!stash.stashed) {
            return { data: { skipped: true, reason: "no stash taken" } };
        }

        const result = await GitService.stashPop();
        return result.success
            ? { data: result.data }
            : { data: { error: result.error }, error: result.error };
    }

    // take stash
    static async stash(): Promise<ToolResult> {
        try {
            const stash = await git.stash();
            logger.plain(stash);
            return { success: true, data: { summary: stash } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    // pop stash
    static async stashPop(): Promise<ToolResult> {
        try {
            const stashPop = await git.stash(['pop']);
            logger.plain(stashPop);
            return { success: true, data: { summary: stashPop } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    // git push
    static async push(): Promise<ToolResult> {
        try {
            const response = await git.push();
            logger.plain(response);
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    // get current branch name
    static async getBranchName(): Promise<ToolResult> {
        try {
            const branch = await git.branch(['--show-current']);
            logger.success(`Branch: ${branch?.current}`);
            return { success: true, data: { branch: branch?.current } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    // stage the files
    static async add(): Promise<ToolResult> {
        try {
            const statusResponse = await GitService.status();
            if (!statusResponse?.success || !statusResponse.data?.indexedFileArr) {
                return { success: false, error: "Failed to fetch status" };
            }

            const indexedFileArr: Array<{ index: number; path: string }> = statusResponse.data.indexedFileArr;
            const answer = await UserInteractionService.askText("Enter comma separated index values or ranges to add (e.g. '1,2-4'), or enter '.' to add all: ");

            if (!answer || !validateGitAddInput(answer)) {
                return { success: false, error: "Invalid input. Expected '.' or numbers/ranges (e.g., '1,2-4')." };
            }

            if (answer.trim() === ".") {
                // Add only the files that appear in indexedFileArr
                // (i.e. those matching the configured tracking extensions),
                // rather than every file in the repo.
                const filePaths = indexedFileArr.map((item) => item.path);
                if (filePaths.length === 0) {
                    return { success: false, error: "No matching file paths found for the provided indices." };
                }
                await git.add(filePaths);
                logger.success(`Added ${filePaths.length} file(s) to staging.`);
            } else {
                const filePaths = getFilePathsFromIndices(answer, indexedFileArr);
                if (filePaths.length === 0) {
                    return { success: false, error: "No matching file paths found for the provided indices." };
                }
                await git.add(filePaths);
                logger.success(`Added ${filePaths.length} file(s) to staging.`);
            }

            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    // show git diff for user-selected tracked file(s)
    // (same index-based selection as add(), with range support e.g. "1,3-5")
    static async diff(_args?: Record<string, any>): Promise<ToolResult> {
        try {
            // Reuse status() to print the indexed list of tracked files.
            const statusResponse = await GitService.status();
            if (!statusResponse?.success || !statusResponse.data?.indexedFileArr) {
                return { success: false, error: "Failed to fetch status" };
            }

            const indexedFileArr: Array<{ index: number; path: string }> = statusResponse.data.indexedFileArr;
            if (indexedFileArr.length === 0) {
                logger.plain("No changes to display.");
                return { success: true, data: { diff: "" } };
            }

            const answer = await UserInteractionService.askText(
                "Enter comma separated index values or ranges to diff (e.g. '1,2-4'), or enter '.' to diff all: "
            );

            if (!answer || !validateGitAddInput(answer)) {
                return { success: false, error: "Invalid input. Expected '.' or numbers/ranges (e.g., '1,2-4')." };
            }

            const filePaths = answer.trim() === "."
                ? indexedFileArr.map((item) => item.path)
                : getFilePathsFromIndices(answer, indexedFileArr);

            if (filePaths.length === 0) {
                return { success: false, error: "No matching file paths found for the provided indices." };
            }

            // Use raw args so selected paths are never interpreted as git options.
            const diffOutput = await git.raw(["diff", "--", ...filePaths]);

            if (!diffOutput) {
                logger.plain("No changes to display.");
                return { success: true, data: { diff: "" } };
            }

            // Colorize each line based on its first character
            const colorized = diffOutput
                .split("\n")
                .map((line) => {
                    if (line.startsWith("+") && !line.startsWith("+++")) {
                        return `${colors.black}${colors.bgGreen}${line}${colors.reset}`;
                    }
                    if (line.startsWith("-") && !line.startsWith("---")) {
                        return `${colors.white}${colors.bgRed}${line}${colors.reset}`;
                    }
                    if (line.startsWith("@@")) {
                        return `${colors.cyan}${line}${colors.reset}`;
                    }
                    if (line.startsWith("diff --git") || line.startsWith("index") || line.startsWith("---") || line.startsWith("+++")) {
                        return `${colors.bold}${line}${colors.reset}`;
                    }
                    return line;
                })
                .join("\n");

            console.log(colorized);
            return { success: true, data: { diff: diffOutput } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    // git commit to specific issue number with message
    // issue number will be fetched from current branch name
    static async commit(args: {message: string}): Promise<ToolResult> {
        try {
            const branchResult = await GitService.getBranchName();
            if (!branchResult.success || !branchResult?.data?.branch) {
                return { success: false, error: "Could not determine current branch name" };
            }
            const branchName = branchResult.data.branch;

            let commitMessage = "";

            if(configs?.Git?.commitPrefixEnabled){
                commitMessage = `${branchResult.data.branch}${args?.message || ""}`;
            }
            else {
                commitMessage = `${args.message}`;
            }

            const response = await git.commit(commitMessage);
            logger.plain(response);
            return { success: true, data: { branch: branchName, message: args.message } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
    // check if git working tree is clean or not 
    static async isClean(): Promise<Boolean> {
        const status = await git.status();
        const res = await status.isClean()
        if(res) return true;
        return false; 
    }
}