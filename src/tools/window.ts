import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerWindowTool(server: McpServer): void {
    server.registerTool(
        "window",
        {
            description: "Manage browser windows and tabs.",
            inputSchema: {
                action: z.enum(["list", "switch", "switch_latest", "new_tab", "new_window", "close"]),
                handle: z.string().optional()
            }
        },
        async ({ action, handle }) => {
            try {
                const driver = driverManager.getOrThrow();

                if (action === "list") {
                    const handles = await driver.getAllWindowHandles();
                    const currentHandle = await driver.getWindowHandle();

                    return textResult(`Found ${handles.length} window handle(s).`, {
                        handles,
                        currentHandle
                    });
                }

                if (action === "switch") {
                    if (!handle) {
                        return errorResult("Window handle is required when action is switch.", {
                            action
                        });
                    }

                    await driver.switchTo().window(handle);

                    return textResult(`Switched to window ${handle}.`, {
                        action,
                        handle
                    });
                }

                if (action === "switch_latest") {
                    const handles = await driver.getAllWindowHandles();
                    const latestHandle = handles.at(-1);

                    if (!latestHandle) {
                        return errorResult("No window handles are available.", {
                            action
                        });
                    }

                    await driver.switchTo().window(latestHandle);

                    return textResult(`Switched to latest window ${latestHandle}.`, {
                        action,
                        handle: latestHandle,
                        handles
                    });
                }

                if (action === "new_tab" || action === "new_window") {
                    const typeHint = action === "new_tab" ? "tab" : "window";
                    await driver.switchTo().newWindow(typeHint);
                    const currentHandle = await driver.getWindowHandle();
                    const handles = await driver.getAllWindowHandles();

                    return textResult(`Opened new ${typeHint}.`, {
                        action,
                        currentHandle,
                        handles
                    });
                }

                await driver.close();

                return textResult("Closed current window.", {
                    action
                });
            } catch (err) {
                return errorResult(`Window action failed: ${toErrorMessage(err)}`, {
                    action,
                    handle
                });
            }
        }
    );
}
