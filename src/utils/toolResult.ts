type Structured = Record<string, unknown>;

export function textResult(message: string, structuredContent?: Structured) {
    if (structuredContent) {
        return {
            content: [{ type: "text" as const, text: message }],
            structuredContent
        };
    }

    return {
        content: [{ type: "text" as const, text: message }]
    };
}

export function errorResult(message: string, structuredContent?: Structured) {
    if (structuredContent) {
        return {
            isError: true,
            content: [{ type: "text" as const, text: message }],
            structuredContent
        };
    }

    return {
        isError: true,
        content: [{ type: "text" as const, text: message }]
    };
}

export function toErrorMessage(err: unknown): string {
    if (err instanceof Error) {
        return err.message;
    }

    return "Unknown error";
}
