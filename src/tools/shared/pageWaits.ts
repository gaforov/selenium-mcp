import { error, type WebDriver } from "selenium-webdriver";
import { toErrorMessage } from "../../utils/toolResult.js";

export type PageConditions = {
    urlContains?: string | undefined;
    urlMatches?: string | undefined;
    titleContains?: string | undefined;
};

export type PageWaitResult = {
    url: string;
    title: string;
    elapsedMs: number;
    waitedFor: string;
};

// Errors that waiting longer cannot fix. They end the wait at once, with what to do next.
const PERMANENT_ERRORS: Array<[new (...args: never[]) => Error, string]> = [
    [error.NoSuchWindowError, "The current window or tab was closed; use the window tool (list, then switch) to continue in another one."],
    [error.NoSuchSessionError, "The browser session has ended; start a new one with start_browser."],
    [error.UnexpectedAlertOpenError, "A dialog (alert, confirm, or prompt) is open; handle it with the alert tool first."]
];

function describeConditions({ urlContains, urlMatches, titleContains }: PageConditions): string {
    const parts: string[] = [];

    if (urlContains !== undefined) {
        parts.push(`URL to contain "${urlContains}"`);
    }

    if (urlMatches !== undefined) {
        parts.push(`URL to match /${urlMatches}/`);
    }

    if (titleContains !== undefined) {
        parts.push(`title to contain "${titleContains}"`);
    }

    return parts.join(" and ");
}

export async function waitForPage(
    driver: WebDriver,
    conditions: PageConditions,
    timeoutMs: number
): Promise<PageWaitResult> {
    const { urlContains, urlMatches, titleContains } = conditions;

    if (urlContains === undefined && urlMatches === undefined && titleContains === undefined) {
        throw new Error("Provide at least one condition: urlContains, urlMatches, or titleContains.");
    }

    let pattern: RegExp | undefined;
    if (urlMatches !== undefined) {
        try {
            pattern = new RegExp(urlMatches);
        } catch {
            throw new Error(`urlMatches is not a valid regular expression: ${urlMatches}`);
        }
    }

    const waitedFor = describeConditions(conditions);
    const started = Date.now();
    let last = { url: "", title: "" };
    let lastError: string | null = null;

    const conditionsMet = async (): Promise<boolean> => {
        try {
            last = { url: await driver.getCurrentUrl(), title: await driver.getTitle() };
            lastError = null;
        } catch (err) {
            const permanent = PERMANENT_ERRORS.find(([type]) => err instanceof type);
            if (permanent) {
                throw new Error(`${permanent[1]} (${toErrorMessage(err)})`);
            }

            // Anything else may be a page mid-navigation: poll again, but keep it for the timeout message.
            lastError = toErrorMessage(err);
            return false;
        }

        return (
            (urlContains === undefined || last.url.includes(urlContains)) &&
            (pattern === undefined || pattern.test(last.url)) &&
            (titleContains === undefined || last.title.includes(titleContains))
        );
    };

    try {
        await driver.wait(conditionsMet, timeoutMs);
    } catch (err) {
        if (err instanceof error.TimeoutError) {
            const seen = lastError
                ? `The last check failed with: ${lastError}`
                : `The page had URL ${last.url} and title "${last.title}".`;
            throw new Error(`Timed out after ${timeoutMs}ms waiting for ${waitedFor}. ${seen}`);
        }

        throw err;
    }

    return {
        ...last,
        elapsedMs: Date.now() - started,
        waitedFor
    };
}
