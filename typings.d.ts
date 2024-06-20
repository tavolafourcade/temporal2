interface ChatAPIFunction {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: Record<string, any>;
        required: string[]
    }  
}

interface ChatAPICallMessage {
    role: "system" | "user" | "assistant";
    content: string;
}