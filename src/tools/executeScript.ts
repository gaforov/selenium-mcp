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
            description: "Execute synchronous JavaScript in the current page context.",
            inputSchema: {
                script: z.string().min(1),
                args: z.array(jsonValueSchema).default([])
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
