import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { useBrowserSession } from "./helpers/harness.mjs";

const byId = (value) => ({ by: "id", value });

describe("wait_for_page (e2e)", { timeout: 120_000 }, () => {
    const session = useBrowserSession();
    const open = () => session.mcp.ok("navigate", { url: session.fixtures.url("redirect.html") });

    it("waits for a delayed redirect after clicking Log in", async () => {
        await open();
        await session.mcp.ok("click", { selector: byId("login") });

        const result = await session.mcp.ok("wait_for_page", { urlContains: "form.html" });
        assert.match(result.data.url, /form\.html\?welcome=1$/);
        assert.equal(result.data.title, "Fixture: Form");
    });

    it("waits for a single-page-app route change using a URL pattern and title together", async () => {
        await open();
        await session.mcp.ok("click", { selector: byId("open-order") });

        const result = await session.mcp.ok("wait_for_page", { urlMatches: "/orders/\\d+$", titleContains: "Order" });
        assert.match(result.data.url, /\/app\/orders\/42$/);
        assert.equal(result.data.title, "Order 42");
    });

    it("on timeout, reports the URL and title the page actually had", async () => {
        await open();

        const result = await session.mcp.call("wait_for_page", { urlContains: "/dashboard", timeoutMs: 300 });
        assert.equal(result.isError, true);
        assert.match(result.text, /Timed out after 300ms waiting for URL to contain "\/dashboard"/);
        assert.match(result.text, /redirect\.html and title "Fixture: Redirect"/);
    });

    it("rejects missing or invalid conditions", async () => {
        const none = await session.mcp.call("wait_for_page", {});
        assert.equal(none.isError, true);
        assert.match(none.text, /at least one condition/);

        const badPattern = await session.mcp.call("wait_for_page", { urlMatches: "(" });
        assert.equal(badPattern.isError, true);
        assert.match(badPattern.text, /not a valid regular expression/);
    });

    it("is available as a batch_execute step", async () => {
        await open();

        const batch = await session.mcp.ok("batch_execute", {
            steps: [
                { action: "click", selector: byId("login") },
                { action: "wait_for_page", urlContains: "welcome=1" }
            ]
        });
        assert.equal(batch.data.results[1].details.title, "Fixture: Form");
    });

    it("stops at once with the real cause when the window is gone", async () => {
        await open();
        await session.mcp.ok("window", { action: "new_tab" });
        await session.mcp.ok("window", { action: "close" });

        const started = Date.now();
        const result = await session.mcp.call("wait_for_page", { urlContains: "/dashboard", timeoutMs: 8000 });
        const elapsed = Date.now() - started;

        assert.equal(result.isError, true);
        assert.match(result.text, /window or tab was closed/);
        assert.ok(elapsed < 4000, `should fail fast instead of waiting the full timeout (took ${elapsed}ms)`);

        // Continue in the remaining tab so the session stays usable.
        await session.mcp.ok("window", { action: "switch_latest" });
    });
});
