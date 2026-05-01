import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerGetPageSourceTool(server: McpServer): void {
    server.registerTool(
        "get_page_source",
        {
            description: "Return the current page source, optionally truncated for LLM-friendly output.",
            inputSchema: {
                maxLength: z.number().int().min(100).max(500000).default(50000)
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
