import * as z from "zod/v4";
import { driverManager } from "../../driver/driverManager.js";
import { getSelectorByRef } from "./pageRefs.js";
import { selectorLabel, selectorSchema, type SelectorInput } from "./selector.js";

export const selectorOrRefInputSchema = z
    .object({
        selector: selectorSchema
            .optional()
            .describe(
                "How to find the element, e.g. { by: 'id', value: 'user-name' } or { by: 'css', value: '#login-button' }. Provide either selector or ref."
            ),
        ref: z
            .string()
            .min(1)
            .optional()
            .describe(
                "Element ref from the latest capture_page result (e.g. 'e12'). Use instead of selector; refs go stale after navigation, so capture again if one is rejected."
            )
    })
    .refine((value) => Boolean(value.selector || value.ref), {
        error: "Either selector or ref is required."
    });

export async function resolveSelectorFromTarget(input: {
    selector: SelectorInput | undefined;
    ref: string | undefined;
}): Promise<{ selector: SelectorInput; label: string; ref?: string }> {
    if (input.selector) {
        return {
            selector: input.selector,
            label: selectorLabel(input.selector)
        };
    }

    const ref = input.ref;
    if (!ref) {
        throw new Error("Either selector or ref is required.");
    }

    const sessionId = driverManager.getActiveSessionId();
    if (!sessionId) {
        throw new Error("Browser is not running. Call start_browser first.");
    }

    const selector = getSelectorByRef(sessionId, ref);
    if (!selector) {
        throw new Error(`Unknown ref for active session: ${ref}. Capture the page again with capture_page.`);
    }

    return {
        selector,
        label: `ref=${ref} (${selectorLabel(selector)})`,
        ref
    };
}
