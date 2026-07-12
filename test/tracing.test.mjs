import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { installToolTracing } from "../dist/utils/tracing.js";

function createFakeServer() {
    return {
        lastHandler: null,
        registerTool(name, config, handler) {
            this.lastHandler = handler;
            return { name, config };
        }
    };
}

async function readTraceLines(path) {
    const raw = await readFile(path, "utf8");
    return raw
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
}

describe("tool tracing", () => {
    it("writes successful tool execution records", async () => {
        const dir = await mkdtemp(join(tmpdir(), "selenium-mcp-trace-"));
        const tracePath = join(dir, "trace.ndjson");
        process.env.SELENIUM_MCP_TRACE = "true";
        process.env.SELENIUM_MCP_TRACE_PATH = tracePath;

        try {
            const fakeServer = createFakeServer();
            installToolTracing(fakeServer);

            fakeServer.registerTool("demo_tool", {}, async (input) => ({
                content: [{ type: "text", text: "ok" }],
                structuredContent: { echoed: input?.value ?? null }
            }));

            await fakeServer.lastHandler({
                value: "x".repeat(600)
            });

            const lines = await readTraceLines(tracePath);
            assert.equal(lines.length, 1);
            assert.equal(lines[0].tool, "demo_tool");
            assert.equal(lines[0].ok, true);
            assert.equal(typeof lines[0].durationMs, "number");
            assert.ok(String(lines[0].input.value).includes("[truncated:"));
        } finally {
            delete process.env.SELENIUM_MCP_TRACE;
            delete process.env.SELENIUM_MCP_TRACE_PATH;
            await rm(dir, { recursive: true, force: true });
        }
    });

    it("writes failed tool execution records", async () => {
        const dir = await mkdtemp(join(tmpdir(), "selenium-mcp-trace-"));
        const tracePath = join(dir, "trace.ndjson");
        process.env.SELENIUM_MCP_TRACE = "true";
        process.env.SELENIUM_MCP_TRACE_PATH = tracePath;

        try {
            const fakeServer = createFakeServer();
            installToolTracing(fakeServer);

            fakeServer.registerTool("boom_tool", {}, async () => {
                throw new Error("boom");
            });

            await assert.rejects(() => fakeServer.lastHandler({ any: "input" }), /boom/);

            const lines = await readTraceLines(tracePath);
            assert.equal(lines.length, 1);
            assert.equal(lines[0].tool, "boom_tool");
            assert.equal(lines[0].ok, false);
            assert.equal(lines[0].error, "boom");
        } finally {
            delete process.env.SELENIUM_MCP_TRACE;
            delete process.env.SELENIUM_MCP_TRACE_PATH;
            await rm(dir, { recursive: true, force: true });
        }
    });
});
