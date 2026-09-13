import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { timeoutMsSchema } from "./shared/selector.js";
import { resolveSelectorFromTarget, selectorOrRefInputSchema } from "./shared/targetSelector.js";
import { waitForClickableElement, waitForVisibleElement } from "./shared/waits.js";

export function registerInteractTool(server: McpServer): void {
    server.registerTool(
        "interact",
        {
            description:
                "Mouse actions beyond a plain click: double_click, right_click (opens a context menu), hover (reveals menus and tooltips), " +
                "or click performed as a real mouse move-and-click. " +
                "Waits for the element to be visible (hover) or visible and enabled (clicks). Target it by selector or by a ref from capture_page. " +
                "For an ordinary click, prefer click.",
            inputSchema: {
                action: z
                    .enum(["click", "double_click", "right_click", "hover"])
                    .describe(
                        "double_click | right_click | hover | click. 'click' moves the mouse onto the element first, which helps with elements that only react to real pointer movement."
                    ),
                selector: selectorOrRefInputSchema.shape.selector,
                ref: selectorOrRefInputSchema.shape.ref,
                timeoutMs: timeoutMsSchema.describe(
                    "How long to wait for the element to become ready, in milliseconds (default 10000)."
                )
            }
        },
        async ({ action, selector, ref, timeoutMs }) => {
            let label = "unknown";
            let resolvedSelector = selector;

            try {
                const target = await resolveSelectorFromTarget({ selector, ref });
                resolvedSelector = target.selector;
                label = target.label;

                const driver = driverManager.getOrThrow();
                const element =
                    action === "hover"
                        ? await waitForVisibleElement(driver, resolvedSelector, timeoutMs)
                        : await waitForClickableElement(driver, resolvedSelector, timeoutMs);
                const actions = driver.actions({ async: true });

                if (action === "click") {
                    await actions.move({ origin: element }).click().perform();
                } else if (action === "double_click") {
                    await actions.move({ origin: element }).doubleClick().perform();
                } else if (action === "right_click") {
                    await actions.move({ origin: element }).contextClick().perform();
                } else {
                    await actions.move({ origin: element }).perform();
                }

                return textResult(`Performed ${action} on element ${label}.`, {
                    action,
                    selector: resolvedSelector,
                    ref,
                    timeoutMs
                });
            } catch (err) {
                return errorResult(`Failed to perform ${action} on element ${label}: ${toErrorMessage(err)}`, {
                    action,
                    selector: resolvedSelector,
                    ref,
                    timeoutMs
                });
            }
        }
    );
}
