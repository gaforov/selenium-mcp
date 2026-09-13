import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { selectorLabel, selectorSchema, timeoutMsSchema } from "./shared/selector.js";
import { waitForLocatedElement } from "./shared/waits.js";

export function registerFrameTool(server: McpServer): void {
    server.registerTool(
        "frame",
        {
            description:
                "Move into or out of an iframe. Elements inside an iframe (embedded widgets, rich-text editors, payment fields) cannot be found by other tools until you switch into it. " +
                "switch = enter a frame by selector, index, or nameOrId; parent = go up one level; default = return to the main page. " +
                "The switch lasts until you change it again or a new page loads, so switch back with default when you are done inside the frame.",
            inputSchema: {
                action: z
                    .enum(["switch", "parent", "default"])
                    .describe("switch = enter a frame (needs selector, index, or nameOrId); parent = up one level; default = back to the main page."),
                selector: selectorSchema
                    .optional()
                    .describe("For switch: the <iframe> element, e.g. { by: 'css', value: 'iframe#editor' }. Most reliable way to pick a frame."),
                index: z
                    .number()
                    .int()
                    .min(0)
                    .optional()
                    .describe("For switch: zero-based position of the frame on the page. Used when no selector is given."),
                nameOrId: z
                    .string()
                    .min(1)
                    .optional()
                    .describe("For switch: the frame's name or id attribute. Used when neither selector nor index is given."),
                timeoutMs: timeoutMsSchema.describe(
                    "How long to wait for the frame element when switching by selector, in milliseconds (default 10000)."
                )
            }
        },
        async ({ action, selector, index, nameOrId, timeoutMs }) => {
            try {
                const driver = driverManager.getOrThrow();

                if (action === "default") {
                    await driver.switchTo().defaultContent();

                    return textResult("Switched to default content.", {
                        action
                    });
                }

                if (action === "parent") {
                    await driver.switchTo().parentFrame();

                    return textResult("Switched to parent frame.", {
                        action
                    });
                }

                if (selector) {
                    const element = await waitForLocatedElement(driver, selector, timeoutMs);
                    await driver.switchTo().frame(element);

                    return textResult(`Switched to frame ${selectorLabel(selector)}.`, {
                        action,
                        selector,
                        timeoutMs
                    });
                }

                if (typeof index === "number") {
                    await driver.switchTo().frame(index);

                    return textResult(`Switched to frame index ${index}.`, {
                        action,
                        index
                    });
                }

                if (nameOrId) {
                    await driver.switchTo().frame(nameOrId);

                    return textResult(`Switched to frame ${nameOrId}.`, {
                        action,
                        nameOrId
                    });
                }

                return errorResult("Frame switch requires selector, index, or nameOrId.", {
                    action
                });
            } catch (err) {
                return errorResult(`Frame action failed: ${toErrorMessage(err)}`, {
                    action,
                    selector,
                    index,
                    nameOrId,
                    timeoutMs
                });
            }
        }
    );
}
