export interface Position {
    x: number;
    y: number;
}

export interface Node {
    id: string;
    type: string;
    position: Position;
    data: any;
}

export interface Edge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

export interface Workflow {
    id?: string;
    name: string;
    description?: string;
    version: number;
    nodes: Node[];
    edges: Edge[];
    userId: string;
    createdAt?: Date;
    updatedAt?: Date;
    isPublished?: boolean;
    useAgentsSDK?: boolean;
    secrets?: Record<string, string>;
}

