import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Key } from "selenium-webdriver";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { selectorLabel, selectorSchema, timeoutMsSchema } from "./shared/selector.js";
import { waitForClickableElement, waitForLocatedElement, waitForVisibleElement } from "./shared/waits.js";

const MAX_BATCH_STEPS = 10;

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

const navigateStepSchema = z.object({
    action: z.literal("navigate"),
    url: z.string().url()
});

const waitForElementStepSchema = z.object({
    action: z.literal("wait_for_element"),
    selector: selectorSchema,
    visible: z.boolean().default(false),
    timeoutMs: timeoutMsSchema
});

const clickStepSchema = z.object({
    action: z.literal("click"),
    selector: selectorSchema,
    timeoutMs: timeoutMsSchema
});

const typeStepSchema = z.object({
    action: z.literal("type"),
    selector: selectorSchema,
    text: z.string(),
    clearFirst: z.boolean().default(true),
    submit: z.boolean().default(false),
    timeoutMs: timeoutMsSchema
});

const executeScriptStepSchema = z.object({
    action: z.literal("execute_script"),
    script: z.string().min(1),
    args: z.array(jsonValueSchema).default([])
});

const batchStepSchema = z.discriminatedUnion("action", [
    navigateStepSchema,
    waitForElementStepSchema,
    clickStepSchema,
    typeStepSchema,
    executeScriptStepSchema
]);

type BatchStep = z.infer<typeof batchStepSchema>;

type BatchStepResult = {
    index: number;
    action: BatchStep["action"];
    ok: boolean;
    details?: Record<string, unknown>;
    error?: string;
};

async function runStep(step: BatchStep): Promise<Record<string, unknown>> {
    const driver = driverManager.getOrThrow();

    switch (step.action) {
        case "navigate": {
            await driver.get(step.url);
            const currentUrl = await driver.getCurrentUrl();
            const title = await driver.getTitle();

            return { currentUrl, title };
        }

        case "wait_for_element": {
            const element = step.visible
                ? await waitForVisibleElement(driver, step.selector, step.timeoutMs)
                : await waitForLocatedElement(driver, step.selector, step.timeoutMs);
            const displayed = await element.isDisplayed();
            const enabled = await element.isEnabled();
            const tagName = await element.getTagName();

            return {
                selector: step.selector,
                timeoutMs: step.timeoutMs,
                visible: step.visible,
                displayed,
                enabled,
                tagName
            };
        }

        case "click": {
            const element = await waitForClickableElement(driver, step.selector, step.timeoutMs);
            await element.click();

            return {
                selector: step.selector,
                timeoutMs: step.timeoutMs,
                label: selectorLabel(step.selector)
            };
        }

        case "type": {
            const element = await waitForVisibleElement(driver, step.selector, step.timeoutMs);
            if (step.clearFirst) {
                await element.clear();
            }

            await element.sendKeys(step.text);
            if (step.submit) {
                await element.sendKeys(Key.ENTER);
            }

            return {
                selector: step.selector,
                timeoutMs: step.timeoutMs,
                clearFirst: step.clearFirst,
                submit: step.submit,
                typedLength: step.text.length,
                label: selectorLabel(step.selector)
            };
        }

        case "execute_script": {
            const result = await driver.executeScript<unknown>(step.script, ...step.args);

            return {
                result
            };
        }
    }
}

export function registerBatchExecuteTool(server: McpServer): void {
    server.registerTool(
        "batch_execute",
        {
            description:
                "Execute a constrained sequence of browser actions in one call. Supported actions: navigate, wait_for_element, click, type, execute_script.",
            inputSchema: {
                steps: z.array(batchStepSchema).min(1).max(MAX_BATCH_STEPS),
                stopOnError: z.boolean().default(true)
            }
        },
        async ({ steps, stopOnError }) => {
            const results: BatchStepResult[] = [];

            for (const [i, step] of steps.entries()) {
                try {
                    const details = await runStep(step);
                    results.push({
                        index: i,
                        action: step.action,
                        ok: true,
                        details
                    });
                } catch (err) {
                    const error = toErrorMessage(err);
                    results.push({
                        index: i,
                        action: step.action,
                        ok: false,
                        error
                    });

                    if (stopOnError) {
                        break;
                    }
                }
            }

            const failed = results.filter((r) => !r.ok).length;
            const executed = results.length;
            const summary = {
                totalSteps: steps.length,
                executedSteps: executed,
                failedSteps: failed,
                stopOnError,
                results
            };

            if (failed > 0) {
                const firstFailed = results.find((r) => !r.ok);
                return errorResult(
                    `Batch failed at step ${firstFailed?.index ?? -1} (${firstFailed?.action ?? "unknown"}).`,
                    summary
                );
            }

            return textResult(`Batch executed successfully (${executed}/${steps.length} steps).`, summary);
        }
    );
}
