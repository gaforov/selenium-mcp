import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerOpenUrlTool(server: McpServer): void {
    server.registerTool(
        "open_url",
        {
            description: "Navigate the active browser session to a URL.",
            inputSchema: {
                url: z.string().url()
            }
        },
        async ({ url }) => {
            try {
                const driver = driverManager.getOrThrow();

                await driver.get(url);

                const title = await driver.getTitle();
                const currentUrl = await driver.getCurrentUrl();

                return textResult(`Opened ${currentUrl}.`, {
                    title,
                    currentUrl
                });
            } catch (err) {
                return errorResult(toErrorMessage(err));
            }
        }
    );
}
