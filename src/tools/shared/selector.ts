import { By } from "selenium-webdriver";
import * as z from "zod/v4";

export const selectorStrategySchema = z.enum([
    "css",
    "xpath",
    "id",
    "name",
    "class",
    "className",
    "tag",
    "tagName",
    "linkText",
    "partialLinkText"
]);

export const selectorSchema = z.object({
    by: selectorStrategySchema,
    value: z.string().min(1)
});

export const timeoutMsSchema = z
    .number()
    .int()
    .min(100)
    .max(60000)
    .default(10000);

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
