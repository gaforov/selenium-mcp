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
            description:
                "Attach a local file to a file input (<input type=\"file\">) without opening the operating system's file picker. " +
                "Waits for the input to exist; it may be hidden, as styled upload buttons often hide the real input, so target the input itself. " +
                "The file must exist on the machine running this server. After attaching, click the page's upload or submit button if it has one.",
            inputSchema: {
                selector: selectorSchema,
                filePath: z
                    .string()
                    .min(1)
                    .describe("Absolute path to the file on the machine running this server, e.g. '/home/me/report.pdf' or 'C:/Users/me/report.pdf'."),
                timeoutMs: timeoutMsSchema.describe(
                    "How long to wait for the file input to exist, in milliseconds (default 10000)."
                )
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
