#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { driverManager } from "./driver/driverManager.js";
import { registerCoreResources } from "./resources/index.js";
import { registerCoreTools, CORE_TOOL_NAMES } from "./tools/index.js";
import { installToolTracing } from "./utils/tracing.js";

// CLI helpers: support --help and --list-tools for quick inspection when run via npx
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
    console.log("selenium-mcp -- Model Context Protocol server for Selenium\n");
    console.log("Usage: selenium-mcp [--help] [--list-tools]");
    console.log("  --help, -h        Show this help message");
    console.log("  --list-tools      Print JSON array of registered tool names and exit");
    process.exit(0);
}

if (args.includes("--list-tools")) {
    // Print the exported tool list and exit.
    console.log(JSON.stringify(CORE_TOOL_NAMES, null, 2));
    process.exit(0);
}

const server = new McpServer({
    name: "selenium-mcp",
    version: "0.1.0"
});

installToolTracing(server);
registerCoreTools(server);
registerCoreResources(server);

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    console.error(`[selenium-mcp] ${signal} received, shutting down.`);

    await Promise.allSettled([driverManager.stopAll(), server.close()]);
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
