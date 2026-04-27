import { Builder, type WebDriver } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import edge from "selenium-webdriver/edge.js";
import firefox from "selenium-webdriver/firefox.js";

export const SUPPORTED_BROWSERS = ["chrome", "firefox", "edge"] as const;

export type BrowserName = (typeof SUPPORTED_BROWSERS)[number];

export interface StartBrowserOptions {
    browser: BrowserName;
    headless: boolean;
}

interface BrowserStatus {
    running: boolean;
    browser: BrowserName | null;
    headless: boolean | null;
    startedAt: string | null;
}

class DriverManager {
    private driver: WebDriver | null = null;
    private browser: BrowserName | null = null;
    private headless: boolean | null = null;
    private startedAt: string | null = null;

    async start({ browser, headless }: StartBrowserOptions): Promise<BrowserStatus> {
        if (this.driver) {
            throw new Error("A browser session is already running. Use stop_browser first.");
        }

        const driver = await this.buildDriver(browser, headless);
        this.driver = driver;
        this.browser = browser;
        this.headless = headless;
        this.startedAt = new Date().toISOString();

        await driver.manage().setTimeouts({
            implicit: 0,
            pageLoad: 30000,
            script: 30000
        });

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
            startedAt: this.startedAt
        };
    }

    private async buildDriver(browser: BrowserName, headless: boolean): Promise<WebDriver> {
        const builder = new Builder();

        switch (browser) {
            case "chrome": {
                const options = new chrome.Options();

                if (headless) {
                    options.addArguments("--headless=new");
                }

                options.addArguments("--disable-dev-shm-usage");
                builder.forBrowser("chrome").setChromeOptions(options);
                break;
            }
            case "firefox": {
                const options = new firefox.Options();

                if (headless) {
                    options.addArguments("-headless");
                }

                builder.forBrowser("firefox").setFirefoxOptions(options);
                break;
            }
            case "edge": {
                const options = new edge.Options();

                if (headless) {
                    options.addArguments("--headless=new");
                }

                builder.forBrowser("MicrosoftEdge").setEdgeOptions(options);
                break;
            }
        }

        return builder.build();
    }
}

export const driverManager = new DriverManager();
