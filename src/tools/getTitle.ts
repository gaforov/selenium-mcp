import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerGetTitleTool(server: McpServer): void {
    server.registerTool(
        "get_title",
        {
            description:
                "Return the current page's title, the text shown in the browser tab. " +
                "Use it to confirm which page is open; to wait until the title changes, use wait_for_page with titleContains."
        },
        async () => {
            try {
                const driver = driverManager.getOrThrow();
                const title = await driver.getTitle();

                return textResult(`Page title: ${title}`, {
                    title
                });
            } catch (err) {
                return errorResult(toErrorMessage(err));
            }
        }
    );
}
