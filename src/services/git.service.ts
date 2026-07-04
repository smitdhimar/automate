import { simpleGit } from "simple-git";
import { logger } from "../utils/logger.js";

const git = simpleGit();

export class GitService {

    static async status(_args?: Record<string, any>) {

        const status = await git.status();
        logger.plain(status);
    }

    static async checkout(args: { branch: string }) {

        await git.checkout(args.branch);
        logger.success(`Switched to branch: ${args.branch}`);
    }
}