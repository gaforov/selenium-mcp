import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { SUPPORTED_BROWSERS, driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerStartBrowserTool(server: McpServer): void {
    server.registerTool(
        "start_browser",
        {
            description: "Start a Selenium browser session.",
            inputSchema: {
                browser: z.enum(SUPPORTED_BROWSERS).default("chrome"),
                headless: z.boolean().default(false)
            }
        },
        async ({ browser, headless }) => {
            try {
                const status = await driverManager.start({ browser, headless });

                return textResult(`Browser started: ${browser} (headless=${headless}).`, {
                    status
                });
            } catch (err) {
                return errorResult(toErrorMessage(err));
            }
        }
    );
}
