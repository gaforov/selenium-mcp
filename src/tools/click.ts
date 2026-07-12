import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { timeoutMsSchema } from "./shared/selector.js";
import { resolveSelectorFromTarget, selectorOrRefInputSchema } from "./shared/targetSelector.js";
import { waitForClickableElement } from "./shared/waits.js";

export function registerClickTool(server: McpServer): void {
    server.registerTool(
        "click",
        {
            description: "Click an element after waiting for it to be visible and enabled.",
            inputSchema: {
                selector: selectorOrRefInputSchema.shape.selector,
                ref: selectorOrRefInputSchema.shape.ref,
                timeoutMs: timeoutMsSchema
            }
        },
        async ({ selector, ref, timeoutMs }) => {
            let label = "unknown";
            let resolvedSelector = selector;

            try {
                const target = await resolveSelectorFromTarget({ selector, ref });
                resolvedSelector = target.selector;
                label = target.label;

                const driver = driverManager.getOrThrow();
                const element = await waitForClickableElement(driver, resolvedSelector, timeoutMs);

                await element.click();

                return textResult(`Clicked element ${label}.`, {
                    selector: resolvedSelector,
                    ref,
                    timeoutMs
                });
            } catch (err) {
                return errorResult(`Failed to click element ${label}: ${toErrorMessage(err)}`, {
                    selector: resolvedSelector,
                    ref,
                    timeoutMs
                });
            }
        }
    );
}
