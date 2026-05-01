#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { driverManager } from "./driver/driverManager.js";
import { registerCoreResources } from "./resources/index.js";
import { registerCoreTools } from "./tools/index.js";

const server = new McpServer({
    name: "selenium-mcp",
    version: "0.1.0"
});

registerCoreTools(server);
registerCoreResources(server);

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    console.error(`[selenium-mcp] ${signal} received, shutting down.`);

    await Promise.allSettled([driverManager.stop(), server.close()]);
}

async function main(): Promise<void> {
    process.on("SIGINT", () => {
        void shutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
        void shutdown("SIGTERM");
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[selenium-mcp] Server running on stdio transport.");
}

main().catch(async (err: unknown) => {
    const message = err instanceof Error ? err.stack ?? err.message : String(err);
    console.error(`[selenium-mcp] Fatal error: ${message}`);
    await shutdown("FATAL");
    process.exit(1);
});
