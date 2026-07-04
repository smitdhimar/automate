export interface ToolDefinition {

    id: string;

    category: string;

    name: string;

    description: string;

    arguments: ToolArgument[];

    handler(args: Record<string, any>): Promise<void>;
}

export interface ToolArgument {

    name: string;

    label: string;

    type:
        | "string"
        | "number"
        | "boolean";

    required: boolean;

    validator?(value: any): boolean;

}