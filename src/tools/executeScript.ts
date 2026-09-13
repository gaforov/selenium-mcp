import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
    z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.null(),
        z.array(jsonValueSchema),
        z.record(z.string(), jsonValueSchema)
    ])
);

export function registerExecuteScriptTool(server: McpServer): void {
    server.registerTool(
        "execute_script",
        {
            description:
                "Run synchronous JavaScript in the current page and return its result (use a return statement); arguments are available as arguments[0], arguments[1], .... " +
                "Useful for reading several values in one call, or page state no other tool exposes (localStorage, computed styles, element counts). " +
                "The script runs with the page's privileges and can change the page; for user actions such as clicking and typing, prefer click and type so real events fire.",
            inputSchema: {
                script: z
                    .string()
                    .min(1)
                    .describe(
                        "JavaScript function body, e.g. 'return document.querySelectorAll(\".inventory_item\").length;'. Return plain JSON values (strings, numbers, booleans, arrays, objects)."
                    ),
                args: z
                    .array(jsonValueSchema)
                    .default([])
                    .describe("JSON values passed to the script as arguments[0], arguments[1], ... (default none).")
            }
        },
        async ({ script, args }) => {
            try {
                const driver = driverManager.getOrThrow();
                const result = await driver.executeScript<unknown>(script, ...args);

                return textResult("Executed JavaScript.", {
                    result
                });
            } catch (err) {
                return errorResult(`Failed to execute JavaScript: ${toErrorMessage(err)}`, {
                    script
                });
            }
        }
    );
}
