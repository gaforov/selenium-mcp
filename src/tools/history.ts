import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

const historyActionSchema = z.enum(["back", "forward", "refresh"]);

type HistoryAction = z.infer<typeof historyActionSchema>;

function describeOutcome(action: HistoryAction, currentUrl: string, urlChanged: boolean): string {
    if (action === "refresh") {
        return `Reloaded ${currentUrl}.`;
    }

    if (urlChanged) {
        return `Went ${action} to ${currentUrl}.`;
    }

    const direction = action === "back" ? "earlier" : "later";
    return `Went ${action}, but the URL did not change (${currentUrl}); there may be no ${direction} page in this tab's history.`;
}

export function registerHistoryTool(server: McpServer): void {
    server.registerTool(
        "history",
        {
            description:
                "Browser history navigation: go back to the previous page (like the Back button), go forward to the next page, or refresh/reload the current page (like F5). " +
                "Waits for the page to load and returns the new URL and title. " +
                "To open a specific URL, use navigate instead. " +
                "Element refs from an earlier capture_page may be stale afterwards, so capture the page again before using refs. " +
                "Refresh can reset unsaved form input.",
            inputSchema: {
                action: historyActionSchema.describe(
                    "'back' = previous page in this tab's history (Back button), 'forward' = next page (Forward button), 'refresh' = reload the current page (F5)."
                )
            }
        },
        async ({ action }) => {
            try {
                const driver = driverManager.getOrThrow();
                const previousUrl = await driver.getCurrentUrl();
                const navigation = driver.navigate();

                switch (action) {
                    case "back":
                        await navigation.back();
                        break;
                    case "forward":
                        await navigation.forward();
                        break;
                    case "refresh":
                        await navigation.refresh();
                        break;
                }

                const currentUrl = await driver.getCurrentUrl();
                const title = await driver.getTitle();
                const urlChanged = currentUrl !== previousUrl;

                return textResult(describeOutcome(action, currentUrl, urlChanged), {
                    action,
                    previousUrl,
                    currentUrl,
                    title,
                    urlChanged
                });
            } catch (err) {
                return errorResult(`Failed to ${action}: ${toErrorMessage(err)}`, { action });
            }
        }
    );
}
