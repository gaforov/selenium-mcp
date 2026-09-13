import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { selectorLabel, selectorSchema, timeoutMsSchema } from "./shared/selector.js";
import { waitForLocatedElement, waitForVisibleElement } from "./shared/waits.js";

export function registerWaitForElementTool(server: McpServer): void {
    server.registerTool(
        "wait_for_element",
        {
            description:
                "Wait for an element to exist in the page, or with visible: true to also be displayed, then return its tag and state (displayed, enabled). " +
                "Use it before acting on content that loads later: spinners finishing, lazy lists, dialogs, single-page-app transitions. " +
                "click, type, and get_text already wait for their own target, so use this to wait for something else first. " +
                "For URL or title changes, use wait_for_page.",
            inputSchema: {
                selector: selectorSchema,
                visible: z
                    .boolean()
                    .default(false)
                    .describe("Also require the element to be displayed, not just present in the DOM (default false)."),
                timeoutMs: timeoutMsSchema.describe("How long to wait, in milliseconds (default 10000, max 60000).")
            }
        },
        async ({ selector, visible, timeoutMs }) => {
            const label = selectorLabel(selector);

            try {
                const driver = driverManager.getOrThrow();
                const element = visible
                    ? await waitForVisibleElement(driver, selector, timeoutMs)
                    : await waitForLocatedElement(driver, selector, timeoutMs);
                const displayed = await element.isDisplayed();
                const enabled = await element.isEnabled();
                const tagName = await element.getTagName();

                return textResult(`Element found: ${label}.`, {
                    selector,
                    timeoutMs,
                    visible,
                    displayed,
                    enabled,
                    tagName
                });
            } catch (err) {
                return errorResult(`Failed waiting for element ${label}: ${toErrorMessage(err)}`, {
                    selector,
                    timeoutMs,
                    visible
                });
            }
        }
    );

    server.registerTool(
        "find_element",
        {
            description:
                "Look up one element and describe it: tag, visible text, and whether it is displayed and enabled. Waits for it to exist. " +
                "Use it to confirm a selector matches the intended element, or to inspect an element before acting. " +
                "To discover elements without knowing a selector, use capture_page; to wait for something to appear, use wait_for_element.",
            inputSchema: {
                selector: selectorSchema,
                timeoutMs: timeoutMsSchema.describe(
                    "How long to wait for the element to exist, in milliseconds (default 10000)."
                )
            }
        },
        async ({ selector, timeoutMs }) => {
            const label = selectorLabel(selector);

            try {
                const driver = driverManager.getOrThrow();
                const element = await waitForLocatedElement(driver, selector, timeoutMs);
                const displayed = await element.isDisplayed();
                const enabled = await element.isEnabled();
                const tagName = await element.getTagName();
                const text = await element.getText();

                return textResult(`Found element ${label}.`, {
                    selector,
                    timeoutMs,
                    displayed,
                    enabled,
                    tagName,
                    text
                });
            } catch (err) {
                return errorResult(`Failed to find element ${label}: ${toErrorMessage(err)}`, {
                    selector,
                    timeoutMs
                });
            }
        }
    );
}
