import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { waitForPage } from "./shared/pageWaits.js";
import { timeoutMsSchema } from "./shared/selector.js";

export function registerWaitForPageTool(server: McpServer): void {
    server.registerTool(
        "wait_for_page",
        {
            description:
                "Wait until the current page's URL or title meets a condition: URL contains text, URL matches a regular expression, and/or title contains text (all given conditions must hold). " +
                "Use after an action that navigates or redirects (submitting a login form, clicking a link, a single-page-app route change) before checking the new page. " +
                "Returns the final URL and title; on timeout, the error shows the URL and title the page actually had. " +
                "To wait for an element to appear, use wait_for_element instead.",
            inputSchema: {
                urlContains: z
                    .string()
                    .min(1)
                    .optional()
                    .describe("Wait until the URL contains this text, e.g. '/dashboard' or 'checkout-step-two'."),
                urlMatches: z
                    .string()
                    .min(1)
                    .optional()
                    .describe("Wait until the URL matches this JavaScript regular expression, e.g. '/orders/[0-9]+$'."),
                titleContains: z
                    .string()
                    .min(1)
                    .optional()
                    .describe("Wait until the page title contains this text (case-sensitive), e.g. 'Dashboard'."),
                timeoutMs: timeoutMsSchema.describe("How long to wait, in milliseconds (default 10000, max 60000).")
            }
        },
        async ({ urlContains, urlMatches, titleContains, timeoutMs }) => {
            try {
                const driver = driverManager.getOrThrow();
                const result = await waitForPage(driver, { urlContains, urlMatches, titleContains }, timeoutMs);

                return textResult(`Page ready: ${result.url} ("${result.title}").`, {
                    ...result,
                    timeoutMs
                });
            } catch (err) {
                return errorResult(`Failed waiting for page: ${toErrorMessage(err)}`, {
                    urlContains,
                    urlMatches,
                    titleContains,
                    timeoutMs
                });
            }
        }
    );
}
