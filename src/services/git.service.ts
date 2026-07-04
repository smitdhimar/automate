import { simpleGit } from "simple-git";
import { logger } from "../utils/logger.js";

const git = simpleGit();

export class GitService {

    static async status() {

        const status = await git.status();
        logger.plain(status);
    }
}