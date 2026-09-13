import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Key } from "selenium-webdriver";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { waitForPage } from "./shared/pageWaits.js";
import { selectorLabel, selectorSchema, timeoutMsSchema } from "./shared/selector.js";
import { selectOption } from "./shared/selectOption.js";
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

const waitForPageStepSchema = z.object({
    action: z.literal("wait_for_page"),
    urlContains: z.string().min(1).optional(),
    urlMatches: z.string().min(1).optional(),
    titleContains: z.string().min(1).optional(),
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

const selectOptionStepSchema = z.object({
    action: z.literal("select_option"),
    selector: selectorSchema,
    text: z.string().optional(),
    value: z.string().optional(),
    index: z.number().int().min(0).optional(),
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
    waitForPageStepSchema,
    clickStepSchema,
    typeStepSchema,
    selectOptionStepSchema,
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

        case "wait_for_page": {
            const result = await waitForPage(driver, step, step.timeoutMs);

            return {
                ...result,
                timeoutMs: step.timeoutMs
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

        case "select_option": {
            const element = await waitForVisibleElement(driver, step.selector, step.timeoutMs);
            const { multiple, selected } = await selectOption(driver, element, step);

            return {
                selector: step.selector,
                timeoutMs: step.timeoutMs,
                label: selectorLabel(step.selector),
                multiple,
                selected
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
                "Run up to 10 steps in one call. Supported actions: navigate, wait_for_element, wait_for_page, click, type, select_option, and execute_script, " +
                "each with the same fields as the standalone tool (selectors only, not capture_page refs). " +
                "Use it for known linear flows such as a login or form fill, to save round trips. " +
                "By default it stops at the first failing step; the result lists every executed step with its details or error.",
            inputSchema: {
                steps: z
                    .array(batchStepSchema)
                    .min(1)
                    .max(MAX_BATCH_STEPS)
                    .describe(
                        "Ordered steps, 1-10. Each has an action plus that action's fields, e.g. { action: 'type', selector: { by: 'id', value: 'user-name' }, text: 'standard_user' }."
                    ),
                stopOnError: z
                    .boolean()
                    .default(true)
                    .describe("Stop at the first failing step (default true). Set false to run every step and collect all errors.")
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
