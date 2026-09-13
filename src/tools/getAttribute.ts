import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { selectorLabel, selectorSchema, timeoutMsSchema } from "./shared/selector.js";
import { waitForLocatedElement } from "./shared/waits.js";

export function registerGetAttributeTool(server: McpServer): void {
    server.registerTool(
        "get_attribute",
        {
            description:
                "Read an attribute or property of an element, e.g. an input's value, a link's href, or whether it is disabled, checked, or aria-expanded. " +
                "Waits for the element to exist (it does not need to be visible). Returns the value, or null if it is not set; " +
                "the live property wins when one exists, so 'value' gives the text currently in an input. " +
                "Use get_text for visible text, and assert_attribute to check a value as a test step.",
            inputSchema: {
                selector: selectorSchema,
                name: z
                    .string()
                    .min(1)
                    .describe("Attribute or property name, e.g. 'value', 'href', 'disabled', 'checked', 'class', or 'aria-expanded'."),
                timeoutMs: timeoutMsSchema.describe(
                    "How long to wait for the element to exist, in milliseconds (default 10000)."
                )
            }
        },
        async ({ selector, name, timeoutMs }) => {
            const label = selectorLabel(selector);

            try {
                const driver = driverManager.getOrThrow();
                const element = await waitForLocatedElement(driver, selector, timeoutMs);
                const value = await element.getAttribute(name);

                return textResult(`Read ${name} from element ${label}.`, {
                    selector,
                    timeoutMs,
                    name,
                    value
                });
            } catch (err) {
                return errorResult(`Failed to read ${name} from element ${label}: ${toErrorMessage(err)}`, {
                    selector,
                    timeoutMs,
                    name
                });
            }
        }
    );
}
