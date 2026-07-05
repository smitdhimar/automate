import { simpleGit } from "simple-git";
import { logger } from "../utils/logger.js";

const git = simpleGit();

export class GitService {

    // gets the status of repo
    static async status(_args?: Record<string, any>) {

        const status = await git.status();
        logger.plain(status);
    }

    // checks out to specified branch
    static async checkout(args: { branch: string }) {

        await git.checkout(args.branch);
        logger.success(`Switched to branch: ${args.branch}`);
    }

    // pull from specific origin branch
    static async pullFrom(args: { branch: string }){
        const response = await git.pull('origin', args.branch);
        logger.plain(response);
    }

    // take stash
    static async stash() {
        const stash = await git.stash();
        logger.plain(stash);
    }

    // pop stash
    static async stashPop() {
        const stashPop = await git.stash(['pop']);
        logger.plain(stashPop);
    }

    // git fetch origin branch-name
    static async fetchFrom(args: {branch: string}) {
        const response = await git.fetch('origin', args.branch);
        logger.plain(response);
    }

    // git push
    static async push() {
        const response = await git.push();
        logger.plain(response);
    }
}