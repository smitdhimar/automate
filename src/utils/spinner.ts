import { Theme, colors } from "../configs/global-configs.js";

export async function withLoader<T>(
    fn: () => Promise<T>
): Promise<T> {
    const { frames, interval } = Theme.spinner;
    let i = 0;

    const timer = setInterval(() => {
        process.stdout.write(`\r${colors.cyan}${frames[i % frames.length]}${colors.reset}`);
        i++;
    }, interval);

    try {
        const result = await fn();
        clearInterval(timer);
        return result;
    } catch (err) {
        clearInterval(timer);
        process.stdout.write("\r \r");
        throw err;
    }
}
