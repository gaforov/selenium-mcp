// End-to-end harness: spawns the built server over stdio (exactly like an MCP client
// such as VS Code or Claude does) and serves local HTML fixtures over HTTP.
// No mocking — every call goes through the real MCP protocol and a real browser.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { after, before } from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fixturesDir = join(repoRoot, "test", "fixtures");
const serverEntry = join(repoRoot, "dist", "server.js");

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8"
};

export async function startFixtureServer() {
    const server = createServer(async (req, res) => {
        const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
        const filePath = join(fixturesDir, normalize(pathname));

        if (!filePath.startsWith(fixturesDir)) {
            res.writeHead(403).end("forbidden");
            return;
        }

        try {
            const body = await readFile(filePath);
            res.writeHead(200, { "content-type": MIME_TYPES[extname(filePath)] ?? "application/octet-stream" });
            res.end(body);
        } catch {
            res.writeHead(404).end("not found");
        }
    });

    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address();

    return {
        url: (page) => `http://127.0.0.1:${port}/${page}`,
        close: () => new Promise((resolve) => server.close(resolve))
    };
}

export async function startMcpClient() {
    const transport = new StdioClientTransport({
        command: process.execPath,
        args: [serverEntry],
        env: { ...process.env },
        stderr: "pipe"
    });

    // Keep server logs out of test output, but retain them for failure diagnostics.
    let stderr = "";
    transport.stderr?.on("data", (chunk) => {
        stderr += chunk;
    });

    const client = new Client({ name: "selenium-mcp-e2e", version: "0.0.0" });
    await client.connect(transport);

    async function call(name, args = {}) {
        const result = await client.callTool({ name, arguments: args });

        return {
            isError: result.isError === true,
            text: (result.content ?? []).map((part) => part.text ?? "").join("\n"),
            data: result.structuredContent ?? {}
        };
    }

    // Like call(), but fails the test with the server's own message if the tool errored.
    async function ok(name, args = {}) {
        const result = await call(name, args);
        if (result.isError) {
            throw new Error(`${name} failed: ${result.text}`);
        }
        return result;
    }

    return {
        client,
        call,
        ok,
        stderr: () => stderr,
        close: () => client.close()
    };
}

// Call inside a describe() block: registers hooks that give the suite its own fixture server,
// MCP server process, and headless browser. Read session.mcp / session.fixtures inside tests.
export function useBrowserSession() {
    const session = {};

    before(async () => {
        session.fixtures = await startFixtureServer();
        session.mcp = await startMcpClient();
        await session.mcp.ok("start_browser", { headless: true, windowSize: { width: 1280, height: 900 } });
    });

    after(async () => {
        await session.mcp?.call("stop_browser").catch(() => {});
        await session.mcp?.close();
        await session.fixtures?.close();
    });

    return session;
}
