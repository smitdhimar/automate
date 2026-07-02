export class ActionRegistry {

    private static actions = new Map<string, () => Promise<void>>();

    static register(name: string, action: () => Promise<void>) {
        this.actions.set(name, action);
    }

    static async execute(name: string) {

        const action = this.actions.get(name);

        if (!action) {
            throw new Error(`Action "${name}" not found`);
        }

        await action();
    }
}