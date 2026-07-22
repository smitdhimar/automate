import { simpleGit } from "simple-git";
import { logger } from "../../utils/logger.js";
import type { ToolResult } from "../../types/configs/ui-configs.types/tool-configs.types.js";

const git = simpleGit();

export class GitService {
    
    // gets the status of repo
    static async status(_args?: Record<string, any>): Promise<ToolResult> {
        try {
            const status = await git.raw(["status"]);
            logger.plain(status);
            return { success: true, data: { status } };
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

    static async addAll(): Promise<ToolResult> {
        try {
            const response = await git.add('.');
            logger.plain(response);
            return { success: true };
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

