import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCoreTools } from "../dist/tools/index.js";

// Descriptions are what an AI reads to pick a tool and fill its parameters, so every tool must
// explain itself and every parameter. Tools still waiting for their rewrite are listed here;
// remove each name once it is done (the second test fails if a listed tool is already complete).
const PENDING = new Set([
    "get_current_url",
    "get_title",
    "get_page_source",
    "take_screenshot",
    "upload_file",
    "frame",
    "alert",
    "add_cookie",
    "get_cookies",
    "delete_cookie",
    "session_create",
    "session_select",
    "session_list",
    "session_destroy",
    "selector_hint_save",
    "selector_hint_get",
    "selector_hint_list",
    "selector_hint_delete",
    "stop_browser"
]);

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
        const failures = tools
            .filter((tool) => !PENDING.has(tool.name))
            .flatMap((tool) => gaps(tool).map((problem) => `${tool.name}: ${problem}`));

        assert.deepEqual(failures, []);
    });

    it("the pending list only holds tools that still need work", async () => {
        const tools = await listTools();
        const alreadyDone = tools.filter((tool) => PENDING.has(tool.name) && gaps(tool).length === 0).map((tool) => tool.name);

        assert.deepEqual(alreadyDone, [], "remove these names from PENDING");
    });
});
