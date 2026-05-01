import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { selectorLabel, selectorSchema, timeoutMsSchema } from "./shared/selector.js";
import { waitForClickableElement, waitForVisibleElement } from "./shared/waits.js";

export function registerInteractTool(server: McpServer): void {
    server.registerTool(
        "interact",
        {
            description: "Perform a mouse action on an element.",
            inputSchema: {
                action: z.enum(["click", "double_click", "right_click", "hover"]),
                selector: selectorSchema,
                timeoutMs: timeoutMsSchema
            }
        },
        async ({ action, selector, timeoutMs }) => {
            const label = selectorLabel(selector);

            try {
                const driver = driverManager.getOrThrow();
                const element =
                    action === "hover"
                        ? await waitForVisibleElement(driver, selector, timeoutMs)
                        : await waitForClickableElement(driver, selector, timeoutMs);
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
                    selector,
                    timeoutMs
                });
            } catch (err) {
                return errorResult(`Failed to perform ${action} on element ${label}: ${toErrorMessage(err)}`, {
                    action,
                    selector,
                    timeoutMs
                });
            }
        }
    );
}
