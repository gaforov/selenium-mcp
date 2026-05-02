# IntelliJ IDEA Usage Guide

This guide walks through setting up and using selenium-mcp in IntelliJ IDEA 2026.1 with your Java/TestNG project.

## Prerequisites

- IntelliJ IDEA 2026.1 (Community or Ultimate)
- Java 11+ installed and configured in IntelliJ
- Node.js 20+ installed on your machine
- selenium-mcp available either from a local checkout or from npm

## Step 1: Prepare selenium-mcp

Choose one option for the server process you want to test.

**Option A: Local checkout (for development and verification)**

```bash
git clone https://github.com/gaforov/selenium-mcp.git
cd selenium-mcp
npm install
npm run build
npm start
```

**Option B: From npm (for published-package testing)**

```bash
npx -y @gaforov/selenium-mcp@latest
```

Keep the terminal open where you ran the command. The server must be running for tools to be available.

## Step 2: Enable MCP Server in IntelliJ

In IntelliJ IDEA 2026.1, the MCP Server plugin is bundled. If you do not see the settings, enable the plugin first.

1. Open **Settings**.
2. Go to **Tools** → **MCP Server**.
3. If the plugin is disabled, open **Plugins**, find **MCP Server**, and check the box to enable it.
4. Accept the third-party/privilege warning if IntelliJ shows one.
5. Click **Apply**.

## Step 3: Connect the client configuration

IntelliJ stores the client connection in its MCP JSON config. If you already have an `mcp.json` file, yes, paste the settings there. If IntelliJ offers **Open Client Settings File**, use that and paste the config into the file it opens.

### Local checkout config

Use this when testing the server from your cloned repo:

```json
{
  "mcpServers": {
    "selenium-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/selenium-mcp/dist/server.js"]
    }
  }
}
```

### npm config

Use this when testing the published package:

```json
{
  "mcpServers": {
    "selenium-mcp": {
      "command": "npx",
      "args": ["-y", "@gaforov/selenium-mcp@latest"]
    }
  }
}
```

### Option A: Use IntelliJ's MCP Server UI

1. Open **Settings** → **Tools** → **MCP Server**.
2. Click **Enable MCP Server**.
3. In the **Clients Auto-Configuration** section, use the client buttons if available.
4. If IntelliJ shows **Open Client Settings File**, open it and paste one of the JSON configs above.
5. Restart IntelliJ if the client does not pick up the config immediately.

### Option B: Use the client settings file directly

1. Open the `mcp.json` file IntelliJ uses for client settings.
2. Paste the local checkout config or the npm config.
3. Save the file.
4. Restart IntelliJ or refresh the MCP connection if prompted.

## Step 4: Run the local test first

Start with the local checkout so you can confirm the repo build works.

1. Run `npm install`.
2. Run `npm run build`.
3. Start the server with `npm start`.
4. Use the local checkout JSON config in IntelliJ.
5. Open the AI assistant or MCP client panel and ask:

   ```text
   List the available selenium-mcp tools.
   ```

6. Then try a small action:

   ```
   Start Chrome, open https://example.com, read the title, then stop the browser.
   ```

If that works, the local install path is good.

## Step 5: Test the npm install second

After the local test passes, switch the JSON config to the npm version and test again.

1. Replace the local `node` config with the npm config.
2. Save the file.
3. Restart IntelliJ or reconnect the MCP client.
4. Run the same prompt again:

   ```text
   Start Chrome, open https://example.com, read the title, then stop the browser.
   ```

If both paths work, you have validated both install methods.

## Supported tool check

JetBrains documents the supported MCP tools here:

https://www.jetbrains.com/help/idea/mcp-server.html#supported-tools

Use that page to compare IntelliJ's supported actions with the Selenium MCP tools exposed by this project.

## Step 6: Use Selenium Tools From Your Test

Once configured, you can ask the AI assistant to help automate browser actions **while keeping your Java/TestNG code unchanged**.

### Example: Testing a Login Form

**Your Java/TestNG test code (unchanged):**

```java
@Test
public void testLoginFlow() {
    // Your normal test setup here
    // The AI assistant handles browser automation via selenium-mcp

    String result = // ... call to assistant or marked comment for AI guidance
    assert result.contains("Dashboard");
}
```

**In the AI Assistant panel, type:**

```
I'm testing a login form at https://example.com/login
- Username field has id "username"
- Password field has id "password"
- Submit button has id "login-btn"
- After login, expect to see "Dashboard" header

Steps:
1. Start Chrome browser
2. Open https://example.com/login
3. Enter "testuser" in username
4. Enter "password123" in password
5. Click login button
6. Read the page title to confirm redirect
```

**The assistant will:**

1. Call `start_browser` to launch Chrome
2. Call `open_url` to navigate to the login page
3. Call `type` to fill the username field
4. Call `type` to fill the password field
5. Call `click` to submit the form
6. Call `get_title` to read the page title
7. Respond with the results

### Example: Assertion-Based Testing

```
Navigate to https://api.example.com/status
Assert that the page contains the text "All systems operational"
```

The assistant will call `navigate`, `get_page_source`, and `assert_text` to verify.

### Example: Multi-Step Workflow

```
I need to test a shopping cart flow:
1. Start browser
2. Go to https://shop.example.com
3. Find and click the product with name "Blue Widget"
4. Wait for the product detail page to load
5. Click "Add to Cart"
6. Verify the cart count shows "1"
7. Navigate to checkout
8. Verify checkout page title is "Checkout"
9. Stop browser

Can you execute this workflow and confirm each step?
```

## Step 7: Debugging Failed Interactions

If an MCP tool call fails, the assistant will show you:

- **Selector used:** e.g., `css: "button.login-btn"`
- **Timeout:** e.g., `10000ms`
- **Error details:** e.g., "Element not clickable: overlay detected"

**Common fixes:**

1. **Element not found:** Verify the selector is correct
   - Inspect element in browser to confirm CSS/XPath
   - Try a different selector strategy (xpath vs css)

2. **Element not clickable:** Element may be hidden or covered
   - Ask assistant to take screenshot: `take_screenshot`
   - Ask assistant to scroll: `press_key: "Page_Down"`
   - Ask assistant to wait longer: increase `timeoutMs` parameter

3. **Page not loaded:** Previous navigation may not have completed
   - Ask assistant to `wait_for_element` before clicking
   - Increase `pageLoadTimeoutMs` in `start_browser` options

## Step 8: Access Full Tool Reference

For a complete list of available tools and their parameters, ask the assistant:

```
Show me all available Selenium tools with their parameters
```

Or read [docs/TOOL_REFERENCE.md](TOOL_REFERENCE.md) directly.

## Step 9: Stop the Server

When done testing:

1. Stop the selenium-mcp server: Press `Ctrl+C` in the terminal where you ran `npm start`
2. The browser session will close (if `stop_browser` wasn't called explicitly)

## Tips for Best Results

1. **Keep selectors specific:** Use `id`, `name`, or `className` when available; avoid generic selectors
2. **Wait for dynamic elements:** Use `wait_for_element` or `wait_until_visible` before interacting with async-loaded content
3. **Use structured prompts:** Tell the assistant what page you're on, what elements exist, and what you expect
4. **Screenshot on failure:** When debugging, ask for a screenshot to see current page state
5. **Reuse browser session:** Start browser once at the beginning; use multiple interactions within one session
6. **Handle popups:** Use `alert` tools to dismiss or accept browser alerts and confirmations
7. **Test form validation:** Use `assert_attribute` to verify disabled/enabled states or error messages

## Troubleshooting

| Issue                            | Solution                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| Tools not appearing in assistant | Restart IntelliJ, verify MCP server is running, check server path in settings                    |
| "Element not found" errors       | Verify selector is correct, take screenshot to debug, try different locator strategy             |
| "Timeout waiting for element"    | Increase timeoutMs, verify element exists, check for page load delays                            |
| Browser won't start              | Verify Chrome/Firefox/Edge is installed, check Node.js PATH, verify npm packages installed       |
| Server crashes                   | Check terminal for error messages, verify Node.js 20+ installed, try `npm rebuild`               |
| Can't connect from assistant     | Ensure selenium-mcp server is running, verify command/args in MCP config match your installation |

## Next Steps

- Read [docs/TOOL_REFERENCE.md](TOOL_REFERENCE.md) for complete tool documentation
- Check [docs/README.md](README.md) for overview and architecture
- Explore [docs/CLIENT_INTEGRATION.md](CLIENT_INTEGRATION.md) for other IDE setup (VS Code, Cursor, etc.)
