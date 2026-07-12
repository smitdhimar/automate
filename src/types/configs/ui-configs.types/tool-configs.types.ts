export interface ToolDefinition {

    id: string;

    category: string; // category tool belongs to

    name: string;

    description: string;

    arguments: ToolArgument[]; // list of args

    handler(args: Record<string, any>): Promise<void | unknown>; // the handler
    
    listTool: boolean;  // whether to list the tool or not 

    helperStr?: string;
}

export interface ToolArgument {

    name: string;

    label: string;

    type:
        | "string"
        | "number"
        | "boolean";

    required: boolean;

    default?: string;

    validator?(value: any): boolean;

}