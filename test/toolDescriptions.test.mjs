import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCoreTools } from "../dist/tools/index.js";

// Descriptions are what an AI reads to pick a tool and fill its parameters, so every tool must
// explain itself and every parameter. New tools cannot ship without them.
const MIN_DESCRIPTION_LENGTH = 100;

// Lists tools the way a client sees them, over an in-memory transport (no browser needed).
async function listTools() {
    const server = new McpServer({ name: "description-check", version: "0.0.0" });
    registerCoreTools(server);

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "description-check", version: "0.0.0" });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const { tools } = await client.listTools();
    await client.close();
    await server.close();

    return tools;
}

function gaps(tool) {
    const problems = [];
    const length = (tool.description ?? "").length;

    if (length < MIN_DESCRIPTION_LENGTH) {
        problems.push(`description is ${length} chars (minimum ${MIN_DESCRIPTION_LENGTH})`);
    }

    for (const [name, schema] of Object.entries(tool.inputSchema.properties ?? {})) {
        if (!schema.description) {
            problems.push(`parameter "${name}" has no description`);
        }
    }

    return problems;
}

describe("tool descriptions", () => {
    it("every tool explains itself and every parameter", async () => {
        const tools = await listTools();
        const failures = tools.flatMap((tool) => gaps(tool).map((problem) => `${tool.name}: ${problem}`));

        assert.deepEqual(failures, []);
    });
});
