import type { WebDriver } from "selenium-webdriver";

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

    const conditionsMet = async (): Promise<boolean> => {
        try {
            last = { url: await driver.getCurrentUrl(), title: await driver.getTitle() };
        } catch {
            // The page can be mid-navigation; treat that as "not yet" and poll again.
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
        if (err instanceof Error && err.name === "TimeoutError") {
            throw new Error(
                `Timed out after ${timeoutMs}ms waiting for ${waitedFor}. The page had URL ${last.url} and title "${last.title}".`
            );
        }

        throw err;
    }

    return {
        ...last,
        elapsedMs: Date.now() - started,
        waitedFor
    };
}
