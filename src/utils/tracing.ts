import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const TRACE_ENV_FLAG = "SELENIUM_MCP_TRACE";
const TRACE_PATH_ENV = "SELENIUM_MCP_TRACE_PATH";
const DEFAULT_TRACE_PATH = "logs/selenium-mcp-trace.ndjson";
const MAX_STRING_LENGTH = 400;
const MAX_DEPTH = 4;
const MAX_ARRAY_ITEMS = 20;
const MAX_OBJECT_KEYS = 30;

type TraceRecord = {
    timestamp: string;
    tool: string;
    ok: boolean;
    durationMs: number;
    input: unknown;
    output?: unknown;
    error?: string;
};

function isTraceEnabled(): boolean {
    return process.env[TRACE_ENV_FLAG] === "true";
}

function getTracePath(): string {
    const configured = process.env[TRACE_PATH_ENV]?.trim();
    return resolve(configured && configured.length > 0 ? configured : DEFAULT_TRACE_PATH);
}

function sanitizeValue(value: unknown, depth = 0): unknown {
    if (depth >= MAX_DEPTH) {
        return "[max-depth]";
    }

    if (typeof value === "string") {
        if (value.length <= MAX_STRING_LENGTH) {
            return value;
        }

        return `${value.slice(0, MAX_STRING_LENGTH)}...[truncated:${value.length}]`;
    }

    if (typeof value === "number" || typeof value === "boolean" || value === null || value === undefined) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeValue(item, depth + 1));
    }

    if (typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_OBJECT_KEYS);
        const sanitized: Record<string, unknown> = {};

        for (const [key, nested] of entries) {
            sanitized[key] = sanitizeValue(nested, depth + 1);
        }

        return sanitized;
    }

    return String(value);
}

function summarizeResult(result: unknown): unknown {
    if (!result || typeof result !== "object") {
        return sanitizeValue(result);
    }

    const structuredContent = (result as { structuredContent?: unknown }).structuredContent;
    const content = (result as { content?: Array<{ type?: string; text?: string }> }).content;
    const isError = (result as { isError?: unknown }).isError;

    return sanitizeValue({
        isError,
        structuredContent,
        content
    });
}

async function writeTraceRecord(record: TraceRecord): Promise<void> {
    const tracePath = getTracePath();
    await mkdir(dirname(tracePath), { recursive: true });
    await appendFile(tracePath, `${JSON.stringify(record)}\n`, "utf8");
}

export function installToolTracing(server: McpServer): void {
    if (!isTraceEnabled()) {
        return;
    }

    type RegisterTool = (
        name: string,
        config: unknown,
        handler: (...args: unknown[]) => unknown
    ) => unknown;

    const serverWithMutableRegister = server as unknown as { registerTool: RegisterTool };
    const originalRegisterTool = serverWithMutableRegister.registerTool.bind(serverWithMutableRegister);

    serverWithMutableRegister.registerTool = (name, config, handler) => {
        const wrappedHandler = async (...args: unknown[]) => {
            const started = Date.now();
            const timestamp = new Date().toISOString();
            const input = sanitizeValue(args[0]);

            try {
                const result = await Promise.resolve(handler(...args));

                await writeTraceRecord({
                    timestamp,
                    tool: name,
                    ok: !Boolean((result as { isError?: unknown })?.isError),
                    durationMs: Date.now() - started,
                    input,
                    output: summarizeResult(result)
                });

                return result;
            } catch (err) {
                await writeTraceRecord({
                    timestamp,
                    tool: name,
                    ok: false,
                    durationMs: Date.now() - started,
                    input,
                    error: err instanceof Error ? err.message : "Unknown error"
                });

                throw err;
            }
        };

        return originalRegisterTool(name, config, wrappedHandler);
    };
}
