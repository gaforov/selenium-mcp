import { By } from "selenium-webdriver";
import * as z from "zod/v4";

export const selectorStrategySchema = z
    .enum(["css", "xpath", "id", "name", "class", "className", "tag", "tagName", "linkText", "partialLinkText"])
    .describe("Locator strategy: css, xpath, id, name, class/className, tag/tagName, linkText, or partialLinkText.");

export const selectorSchema = z
    .object({
        by: selectorStrategySchema,
        value: z
            .string()
            .min(1)
            .describe(
                "The locator for that strategy, e.g. '#login-button' for css, 'user-name' for id, or //button[@type=\"submit\"] for xpath."
            )
    })
    .describe(
        "How to find the element, e.g. { by: 'css', value: '#login-button' } or { by: 'id', value: 'user-name' }. Prefer id, name, or a short CSS selector."
    );

export const timeoutMsSchema = z
    .number()
    .int()
    .min(100)
    .max(60000)
    .default(10000)
    .describe("How long to wait for the element, in milliseconds (default 10000, max 60000).");

export type SelectorInput = z.infer<typeof selectorSchema>;

export function selectorToBy(selector: SelectorInput): By {
    switch (selector.by) {
        case "css":
            return By.css(selector.value);
        case "xpath":
            return By.xpath(selector.value);
        case "id":
            return By.id(selector.value);
        case "name":
            return By.name(selector.value);
        case "class":
        case "className":
            return By.className(selector.value);
        case "tag":
        case "tagName":
            return By.tagName(selector.value);
        case "linkText":
            return By.linkText(selector.value);
        case "partialLinkText":
            return By.partialLinkText(selector.value);
    }
}

export function selectorLabel(selector: SelectorInput): string {
    return `${selector.by}=${selector.value}`;
}
