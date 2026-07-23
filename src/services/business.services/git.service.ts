import { simpleGit, StatusResult } from "simple-git";
import { logger } from "../../utils/logger.js";
import type { ToolResult } from "../../types/configs/ui-configs.types/tool-configs.types.js";
import { ConfigService } from "../cli.services/config.service.js";
import { PromptService } from "../cli.services/prompt.service.js";
import { validateGitAddInput, getFilePathsFromIndices } from "../../utils/utilsForServices.ts/gitServiceUtils.js";
import { colors } from "../../configs/global-configs.js";

const git = simpleGit();
const configs = ConfigService.readConfig();

export class GitService {
    
    // gets the status of repo
    static async status(_args?: Record<string, any>): Promise<ToolResult> {
        try {
            // const status = await git.raw(["status"]);
            const response:StatusResult = await git.status();
            const indexedFileArr = response?.files?.map( (fileStatusSummary, index) => ({ index: index+1, path: fileStatusSummary?.path }) );

            logger.plain(indexedFileArr);
            return { success: true, data: { indexedFileArr } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
    
    // checks out to specified branch
    static async checkout(args: { branch: string, origin?: string }): Promise<ToolResult> {
        try {
            const result = await git.branch();
            const branches = result?.all;
            if(!branches.includes(args.branch)){
                await git.fetch(args.origin || 'origin', args.branch);
            }
            const checkoutResponse = await git.checkout(args.branch);

            logger.plain(checkoutResponse);

            return { success: true, data: { branch: args.branch } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
    
    // pull from specific origin branch
    static async pullFrom(args: { branch: string, origin?: string }): Promise<ToolResult> {
        try {
            const response = await git.pull(args.origin || 'origin', args.branch);
            logger.plain(response);
            return { success: true, data: { summary: response.summary } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
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

    static async add(): Promise<ToolResult> {
        try {
            const statusResponse = await GitService.status();
            if (!statusResponse?.success || !statusResponse.data?.indexedFileArr) {
                return { success: false, error: "Failed to fetch status" };
            }

            const indexedFileArr: Array<{ index: number; path: string }> = statusResponse.data.indexedFileArr;
            const answer = await PromptService.collectAnswer("Enter comma separated index values to add, or enter '.' to add all: ");

            if (!answer || !validateGitAddInput(answer)) {
                return { success: false, error: "Invalid input. Expected '.' or comma-separated numbers (e.g., '1,2,3')." };
            }

            if (answer.trim() === ".") {
                await git.add("*");
                logger.success("Added all files to staging.");
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

    // show git diff with color-coded output (red for removals, green for additions)
    static async diff(args: { target?: string}): Promise<ToolResult> {
        try {
            const diffArgs: string[] = [];
            if (args?.target) diffArgs.push(args.target);

            const diffOutput = await git.diff(diffArgs);

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
            if (!branchResult.success || !branchResult.data?.branch) {
                return { success: false, error: "Could not determine current branch name" };
            }
            const branchName = branchResult.data.branch;
            const response = await git.commit(`${branchName} ${args.message}`);
            logger.plain(response);
            return { success: true, data: { branch: branchName, message: args.message } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
}

