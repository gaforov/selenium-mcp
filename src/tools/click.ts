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
            description:
                "Click an element: waits until it is visible and enabled, then clicks it (scrolling it into view). " +
                "Target it by selector or by a ref from capture_page. " +
                "If clicks fail intermittently because of overlays, animations, or re-rendering, use retry_click; for double-click, right-click, or hover, use interact. " +
                "Fails with the reason if the element does not become clickable within timeoutMs.",
            inputSchema: {
                selector: selectorOrRefInputSchema.shape.selector,
                ref: selectorOrRefInputSchema.shape.ref,
                timeoutMs: timeoutMsSchema.describe(
                    "How long to wait for the element to become visible and enabled, in milliseconds (default 10000)."
                )
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
