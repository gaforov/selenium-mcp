import { until, type WebDriver, type WebElement } from "selenium-webdriver";
import { selectorLabel, selectorToBy, type SelectorInput } from "./selector.js";

export async function waitForVisibleElement(
    driver: WebDriver,
    selector: SelectorInput,
    timeoutMs: number
): Promise<WebElement> {
    const by = selectorToBy(selector);
    const label = selectorLabel(selector);

    await driver.wait(until.elementLocated(by), timeoutMs, `Timed out locating element: ${label}`);
    const element = await driver.findElement(by);
    await driver.wait(until.elementIsVisible(element), timeoutMs, `Timed out waiting for element visibility: ${label}`);

    return element;
}

export async function waitForClickableElement(
    driver: WebDriver,
    selector: SelectorInput,
    timeoutMs: number
): Promise<WebElement> {
    const element = await waitForVisibleElement(driver, selector, timeoutMs);
    const label = selectorLabel(selector);

    await driver.wait(until.elementIsEnabled(element), timeoutMs, `Timed out waiting for element enabled state: ${label}`);

    return element;
}
