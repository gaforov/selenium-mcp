import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerGetPageSourceTool(server: McpServer): void {
    server.registerTool(
        "get_page_source",
        {
            description:
                "Return the page's current HTML (the live DOM, including changes made by scripts), cut off at maxLength characters. " +
                "Returns the HTML, its full length, and whether it was truncated. " +
                "It is large and noisy: to find elements to act on, prefer capture_page; to read specific text or values, use get_text or get_attribute. " +
                "Use this for raw markup such as meta tags, hidden fields, or inline data.",
            inputSchema: {
                maxLength: z
                    .number()
                    .int()
                    .min(100)
                    .max(500000)
                    .default(50000)
                    .describe("Maximum characters of HTML to return, 100-500000 (default 50000). Longer pages are truncated.")
            }
        },
        async ({ maxLength }) => {
            try {
                const driver = driverManager.getOrThrow();
                const source = await driver.getPageSource();
                const truncated = source.length > maxLength;
                const text = truncated ? source.slice(0, maxLength) : source;

                return textResult(`Read page source (${source.length} characters${truncated ? ", truncated" : ""}).`, {
                    source: text,
                    length: source.length,
                    maxLength,
                    truncated
                });
            } catch (err) {
                return errorResult(toErrorMessage(err), {
                    maxLength
                });
            }
        }
    );
}
