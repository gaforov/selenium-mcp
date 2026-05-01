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
            description: "Read an attribute or property value from an element.",
            inputSchema: {
                selector: selectorSchema,
                name: z.string().min(1),
                timeoutMs: timeoutMsSchema
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
