import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { describeResize, shouldEmulate } from "../dist/tools/shared/viewport.js";

// These cases cannot happen in headless CI (no screen limit), so they are covered here.
describe("viewport resize decisions", () => {
    it("emulates when the window could not shrink to the requested size", () => {
        // Chromium keeps windows at least ~500px wide.
        assert.equal(shouldEmulate({ width: 526, height: 844 }, { width: 390, height: 844 }), true);
    });

    it("does not emulate when the screen stopped the window from growing", () => {
        // 1920x1080 requested in a visible browser on a 1080p screen: toolbars take some height.
        assert.equal(shouldEmulate({ width: 1920, height: 960 }, { width: 1920, height: 1080 }), false);
    });

    it("does not emulate when one side is too large and the other too small", () => {
        assert.equal(shouldEmulate({ width: 526, height: 700 }, { width: 390, height: 844 }), false);
    });

    it("does not emulate when the size is already exact", () => {
        assert.equal(shouldEmulate({ width: 768, height: 1024 }, { width: 768, height: 1024 }), false);
    });

    it("blames the screen, not a minimum size, when the window could not grow", () => {
        const message = describeResize(
            { width: 1920, height: 1080 },
            { viewport: { width: 1920, height: 960 }, emulated: false },
            true
        );
        assert.match(message, /screen is too small/);
        assert.doesNotMatch(message, /cannot be made that small|minimum window size/);
    });

    it("explains the minimum window size when emulation is unavailable", () => {
        const message = describeResize(
            { width: 390, height: 844 },
            { viewport: { width: 450, height: 844 }, emulated: false },
            false
        );
        assert.match(message, /minimum window size/);
        assert.match(message, /Chrome or Edge/);
    });
});
