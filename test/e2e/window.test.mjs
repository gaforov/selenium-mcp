import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { useBrowserSession } from "./helpers/harness.mjs";

const byId = (value) => ({ by: "id", value });

describe("window resize and maximize (e2e)", { timeout: 120_000 }, () => {
    const session = useBrowserSession();
    const open = () => session.mcp.ok("navigate", { url: session.fixtures.url("responsive.html") });
    const isVisible = async (id) => {
        const result = await session.mcp.call("wait_for_element", { selector: byId(id), visible: true, timeoutMs: 300 });
        return !result.isError;
    };

    it("resizes the viewport so the page's mobile layout kicks in, and back", async () => {
        await open();
        assert.equal(await isVisible("mobile-menu"), false, "mobile menu should be hidden at desktop width");

        const phone = await session.mcp.ok("window", { action: "resize", width: 390, height: 844 });
        assert.deepEqual(phone.data.viewport, { width: 390, height: 844 });
        assert.equal(await isVisible("mobile-menu"), true);
        assert.equal(await isVisible("desktop-nav"), false);

        const desktop = await session.mcp.ok("window", { action: "resize", width: 1280, height: 900 });
        assert.deepEqual(desktop.data.viewport, { width: 1280, height: 900 });
        assert.equal(await isVisible("desktop-nav"), true);
        assert.equal(await isVisible("mobile-menu"), false);
    });

    it("keeps the browser-status resource in sync with the new size", async () => {
        const resized = await session.mcp.ok("window", { action: "resize", width: 768, height: 1024 });

        const resource = await session.mcp.client.readResource({ uri: "browser-status://current" });
        const status = JSON.parse(resource.contents[0].text);
        assert.deepEqual(status.windowSize, resized.data.window);
    });

    it("requires both width and height for resize", async () => {
        const result = await session.mcp.call("window", { action: "resize", width: 390 });
        assert.equal(result.isError, true);
        assert.match(result.text, /requires both width and height/);
    });

    it("maximizes, and the existing tab actions still behave", async () => {
        const maximized = await session.mcp.ok("window", { action: "maximize" });
        assert.ok(maximized.data.window.width > 0 && maximized.data.viewport.width > 0);

        const list = await session.mcp.ok("window", { action: "list" });
        assert.equal(list.data.handles.length, 1);
        assert.equal(list.data.currentHandle, list.data.handles[0]);
    });
});
