import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerNavigateTool(server: McpServer): void {
    server.registerTool(
        "navigate",
        {
            description:
                "Open a URL in the current tab and wait for the page to load (up to the pageLoadTimeoutMs set in start_browser). " +
                "Returns the final URL after any redirects, and the page title. " +
                "Use history to go back, forward, or refresh; use wait_for_page when a later redirect or client-side route change still has to happen.",
            inputSchema: {
                url: z
                    .string()
                    .url()
                    .describe("Absolute URL including the scheme, e.g. 'https://www.saucedemo.com'.")
            }
        },
        async ({ url }) => {
            try {
                const driver = driverManager.getOrThrow();

                await driver.get(url);

                const title = await driver.getTitle();
                const currentUrl = await driver.getCurrentUrl();

                return textResult(`Navigated to ${currentUrl}.`, {
                    title,
                    currentUrl
                });
            } catch (err) {
                return errorResult(`Failed to navigate to ${url}: ${toErrorMessage(err)}`, {
                    url
                });
            }
        }
    );
}
