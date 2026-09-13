import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { CORE_TOOL_NAMES } from "../../dist/tools/index.js";
import { useBrowserSession } from "./helpers/harness.mjs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));

const byId = (value) => ({ by: "id", value });

describe("core browser flow (e2e)", { timeout: 120_000 }, () => {
    const session = useBrowserSession();
    const open = (page) => session.mcp.ok("navigate", { url: session.fixtures.url(page) });

    it("reports the package version and registers exactly the advertised tools", async () => {
        assert.equal(session.mcp.client.getServerVersion()?.version, pkg.version);

        const { tools } = await session.mcp.client.listTools();
        const registered = tools.map((tool) => tool.name).sort();
        assert.deepEqual(registered, [...CORE_TOOL_NAMES].sort());
    });

    it("navigates to a page and reports its title", async () => {
        const result = await open("form.html");
        assert.equal(result.data.title, "Fixture: Form");
        assert.match(result.data.currentUrl, /\/form\.html$/);
    });

    it("type clears the field first by default, then click updates the page", async () => {
        await open("form.html");

        await session.mcp.ok("type", { selector: byId("name"), text: "Said" });
        await session.mcp.ok("assert_attribute", { selector: byId("name"), name: "value", expected: "Said" });

        await session.mcp.ok("click", { selector: byId("greet") });
        const greeting = await session.mcp.ok("get_text", { selector: byId("greeting") });
        assert.equal(greeting.data.text, "Hello, Said!");
    });

    it("type with clearFirst:false appends to the existing value", async () => {
        await open("form.html");

        await session.mcp.ok("type", { selector: byId("name"), text: " Jr", clearFirst: false });
        await session.mcp.ok("assert_attribute", { selector: byId("name"), name: "value", expected: "prefilled Jr" });
    });

    it("wait_for_element waits for content that appears later", async () => {
        await open("form.html");

        await session.mcp.ok("click", { selector: byId("load-later") });
        const waited = await session.mcp.ok("wait_for_element", {
            selector: byId("late"),
            visible: true,
            timeoutMs: 5000
        });
        assert.equal(waited.data.displayed, true);
        assert.equal(waited.data.tagName, "p");

        await session.mcp.ok("assert_text", { selector: byId("late"), expected: "Loaded later", mode: "equals" });
    });

    it("capture_page refs can drive follow-up actions", async () => {
        await open("form.html");

        const snapshot = await session.mcp.ok("capture_page");
        const refFor = (id) => snapshot.data.nodes.find((node) => node.id === id)?.ref;
        const nameRef = refFor("name");
        const greetRef = refFor("greet");
        assert.ok(nameRef && greetRef, "snapshot should include refs for #name and #greet");

        await session.mcp.ok("type", { ref: nameRef, text: "Ref User" });
        await session.mcp.ok("click", { ref: greetRef });
        const greeting = await session.mcp.ok("get_text", { selector: byId("greeting") });
        assert.equal(greeting.data.text, "Hello, Ref User!");
    });

    it("reports failures as tool errors and keeps the session usable", async () => {
        await open("form.html");

        const missing = await session.mcp.call("wait_for_element", { selector: byId("does-not-exist"), timeoutMs: 300 });
        assert.equal(missing.isError, true);
        assert.match(missing.text, /Failed waiting for element id=does-not-exist/);

        const mismatch = await session.mcp.call("assert_text", {
            selector: { by: "css", value: "h1" },
            expected: "Nope",
            mode: "equals"
        });
        assert.equal(mismatch.isError, true);
        assert.equal(mismatch.data.actual, "Fixture form");

        const after = await open("form.html");
        assert.equal(after.data.title, "Fixture: Form");
    });
});
