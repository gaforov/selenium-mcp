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
            description: "Switch browser frame focus by index, name/id, selector, parent, or default content.",
            inputSchema: {
                action: z.enum(["switch", "parent", "default"]),
                selector: selectorSchema.optional(),
                index: z.number().int().min(0).optional(),
                nameOrId: z.string().min(1).optional(),
                timeoutMs: timeoutMsSchema
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
