import { Builder, type WebDriver } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import edge from "selenium-webdriver/edge.js";
import firefox from "selenium-webdriver/firefox.js";

export const SUPPORTED_BROWSERS = ["chrome", "firefox", "edge"] as const;

export type BrowserName = (typeof SUPPORTED_BROWSERS)[number];

export interface StartBrowserOptions {
    browser: BrowserName;
    headless: boolean;
    browserArgs: string[];
    pageLoadTimeoutMs: number;
    scriptTimeoutMs: number;
    windowSize: {
        width: number;
        height: number;
    } | null;
}

interface BrowserStatus {
    running: boolean;
    browser: BrowserName | null;
    headless: boolean | null;
    browserArgs: string[];
    windowSize: {
        width: number;
        height: number;
    } | null;
    startedAt: string | null;
}

class DriverManager {
    private driver: WebDriver | null = null;
    private browser: BrowserName | null = null;
    private headless: boolean | null = null;
    private browserArgs: string[] = [];
    private windowSize: {
        width: number;
        height: number;
    } | null = null;
    private startedAt: string | null = null;

    async start(options: StartBrowserOptions): Promise<BrowserStatus> {
        if (this.driver) {
            throw new Error("A browser session is already running. Use stop_browser first.");
        }

        const driver = await this.buildDriver(options);
        this.driver = driver;
        this.browser = options.browser;
        this.headless = options.headless;
        this.browserArgs = options.browserArgs;
        this.windowSize = options.windowSize;
        this.startedAt = new Date().toISOString();

        await driver.manage().setTimeouts({
            implicit: 0,
            pageLoad: options.pageLoadTimeoutMs,
            script: options.scriptTimeoutMs
        });

        if (options.windowSize) {
            await driver.manage().window().setRect({
                width: options.windowSize.width,
                height: options.windowSize.height
            });
        }

        return this.status();
    }

    getOrThrow(): WebDriver {
        if (!this.driver) {
            throw new Error("Browser is not running. Call start_browser first.");
        }

        return this.driver;
    }

    async stop(): Promise<BrowserStatus> {
        if (this.driver) {
            try {
                await this.driver.quit();
            } finally {
                this.driver = null;
                this.browser = null;
                this.headless = null;
                this.browserArgs = [];
                this.windowSize = null;
                this.startedAt = null;
            }
        }

        return this.status();
    }

    status(): BrowserStatus {
        return {
            running: this.driver !== null,
            browser: this.browser,
            headless: this.headless,
            browserArgs: this.browserArgs,
            windowSize: this.windowSize,
            startedAt: this.startedAt
        };
    }

    private async buildDriver({ browser, headless, browserArgs }: StartBrowserOptions): Promise<WebDriver> {
        const builder = new Builder();

        switch (browser) {
            case "chrome": {
                const options = new chrome.Options();

                if (headless) {
                    options.addArguments("--headless=new");
                }

                options.addArguments("--disable-dev-shm-usage");
                options.addArguments(...browserArgs);
                builder.forBrowser("chrome").setChromeOptions(options);
                break;
            }
            case "firefox": {
                const options = new firefox.Options();

                if (headless) {
                    options.addArguments("-headless");
                }

                options.addArguments(...browserArgs);
                builder.forBrowser("firefox").setFirefoxOptions(options);
                break;
            }
            case "edge": {
                const options = new edge.Options();

                if (headless) {
                    options.addArguments("--headless=new");
                }

                options.addArguments(...browserArgs);
                builder.forBrowser("MicrosoftEdge").setEdgeOptions(options);
                break;
            }
        }

        return builder.build();
    }
}

export const driverManager = new DriverManager();
