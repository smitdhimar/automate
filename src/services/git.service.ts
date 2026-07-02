import simpleGit from "simple-git";

const git = simpleGit();

export class GitService {

    static async status() {

        const status = await git.status();

        console.log(status);
    }
}