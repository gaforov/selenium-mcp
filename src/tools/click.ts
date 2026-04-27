import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { selectorLabel, selectorSchema, timeoutMsSchema } from "./shared/selector.js";
import { waitForClickableElement } from "./shared/waits.js";

export function registerClickTool(server: McpServer): void {
    server.registerTool(
        "click",
        {
            description: "Click an element after waiting for it to be visible and enabled.",
            inputSchema: {
                selector: selectorSchema,
                timeoutMs: timeoutMsSchema
            }
        },
        async ({ selector, timeoutMs }) => {
            const label = selectorLabel(selector);

            try {
                const driver = driverManager.getOrThrow();
                const element = await waitForClickableElement(driver, selector, timeoutMs);

                await element.click();

                return textResult(`Clicked element ${label}.`, {
                    selector,
                    timeoutMs
                });
            } catch (err) {
                return errorResult(`Failed to click element ${label}: ${toErrorMessage(err)}`, {
                    selector,
                    timeoutMs
                });
            }
        }
    );
}
