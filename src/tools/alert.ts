import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerAlertTool(server: McpServer): void {
    server.registerTool(
        "alert",
        {
            description: "Handle browser alert, confirm, or prompt dialogs.",
            inputSchema: {
                action: z.enum(["get_text", "accept", "dismiss", "send_text"]),
                text: z.string().optional()
            }
        },
        async ({ action, text }) => {
            try {
                const driver = driverManager.getOrThrow();
                const alert = await driver.switchTo().alert();
                const alertText = await alert.getText();

                if (action === "get_text") {
                    return textResult("Read alert text.", {
                        action,
                        text: alertText
                    });
                }

                if (action === "send_text") {
                    if (text === undefined) {
                        return errorResult("Text is required when action is send_text.", {
                            action
                        });
                    }

                    await alert.sendKeys(text);

                    return textResult("Sent text to alert.", {
                        action,
                        previousText: alertText,
                        sentLength: text.length
                    });
                }

                if (action === "accept") {
                    await alert.accept();

                    return textResult("Accepted alert.", {
                        action,
                        text: alertText
                    });
                }

                await alert.dismiss();

                return textResult("Dismissed alert.", {
                    action,
                    text: alertText
                });
            } catch (err) {
                return errorResult(`Alert action failed: ${toErrorMessage(err)}`, {
                    action
                });
            }
        }
    );
}
