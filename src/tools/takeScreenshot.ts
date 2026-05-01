import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerTakeScreenshotTool(server: McpServer): void {
    server.registerTool(
        "take_screenshot",
        {
            description: "Capture a PNG screenshot and return base64 data.",
            inputSchema: {
                includeBase64: z.boolean().default(true)
            }
        },
        async ({ includeBase64 }) => {
            try {
                const driver = driverManager.getOrThrow();
                const base64 = await driver.takeScreenshot();

                return textResult("Captured screenshot.", {
                    mimeType: "image/png",
                    base64Length: base64.length,
                    base64: includeBase64 ? base64 : undefined
                });
            } catch (err) {
                return errorResult(toErrorMessage(err));
            }
        }
    );
}
