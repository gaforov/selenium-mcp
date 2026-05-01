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
            description: "Wait for an element to exist, with optional visibility requirement.",
            inputSchema: {
                selector: selectorSchema,
                visible: z.boolean().default(false),
                timeoutMs: timeoutMsSchema
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
        "wait_until_visible",
        {
            description: "Wait for an element to be visible.",
            inputSchema: {
                selector: selectorSchema,
                timeoutMs: timeoutMsSchema
            }
        },
        async ({ selector, timeoutMs }) => {
            const label = selectorLabel(selector);

            try {
                const driver = driverManager.getOrThrow();
                const element = await waitForVisibleElement(driver, selector, timeoutMs);
                const enabled = await element.isEnabled();
                const tagName = await element.getTagName();

                return textResult(`Element is visible: ${label}.`, {
                    selector,
                    timeoutMs,
                    displayed: true,
                    enabled,
                    tagName
                });
            } catch (err) {
                return errorResult(`Element did not become visible ${label}: ${toErrorMessage(err)}`, {
                    selector,
                    timeoutMs
                });
            }
        }
    );

    server.registerTool(
        "find_element",
        {
            description: "Find an element and return basic metadata. Alias-friendly discovery tool.",
            inputSchema: {
                selector: selectorSchema,
                timeoutMs: timeoutMsSchema
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
