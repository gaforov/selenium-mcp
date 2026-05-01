import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { selectorLabel, selectorSchema, timeoutMsSchema } from "./shared/selector.js";
import { waitForLocatedElement } from "./shared/waits.js";

export function registerUploadFileTool(server: McpServer): void {
    server.registerTool(
        "upload_file",
        {
            description: "Send an absolute file path to a file input element.",
            inputSchema: {
                selector: selectorSchema,
                filePath: z.string().min(1),
                timeoutMs: timeoutMsSchema
            }
        },
        async ({ selector, filePath, timeoutMs }) => {
            const label = selectorLabel(selector);

            try {
                const driver = driverManager.getOrThrow();
                const element = await waitForLocatedElement(driver, selector, timeoutMs);

                await element.sendKeys(filePath);

                return textResult(`Uploaded file path into element ${label}.`, {
                    selector,
                    timeoutMs,
                    filePath
                });
            } catch (err) {
                return errorResult(`Failed to upload file with element ${label}: ${toErrorMessage(err)}`, {
                    selector,
                    timeoutMs,
                    filePath
                });
            }
        }
    );
}
