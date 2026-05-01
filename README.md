# selenium-mcp

Selenium MCP server for browser automation through Model Context Protocol clients.

It is built with TypeScript, the official MCP SDK, Selenium WebDriver, strict zod input validation, explicit waits, and structured responses that are useful to both humans and AI agents.

## Features

- Launch Chrome, Firefox, or Edge
- Navigate pages and read URL/title/source
- Find, click, type, hover, right-click, double-click, and retry-click elements
- Read text and attributes
- Press keyboard keys
- Capture screenshots
- Upload files through file inputs
- Execute JavaScript
- Assert visible text, attributes, and visibility
- Manage tabs/windows, frames, alerts, and cookies
- Expose browser status and accessibility snapshot MCP resources

## What's New In v0.1.0

- First public npm release: `@gaforov/selenium-mcp`
- Expanded toolset for end-to-end browser automation, assertions, and diagnostics
- Added MCP resources for browser status and accessibility snapshot context
- Added broad client setup documentation for IntelliJ, VS Code, Cursor, Claude, Goose, and Windsurf
- Added CI workflow and baseline tests for shared contracts

## Requirements

- Node.js 20+
- Chrome, Firefox, or Edge installed

Selenium Manager handles browser drivers for supported local browsers.

## Quick Start From Source

```bash
git clone https://github.com/gaforov/selenium-mcp.git
cd selenium-mcp
npm install
npm run build
npm start
```

## MCP Client Config

Local source checkout:

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

After npm publish:

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

For IntelliJ IDEA, VS Code, Cursor, Claude Desktop, Claude Code, Goose, and Windsurf setup notes, see [docs/CLIENT_INTEGRATION.md](docs/CLIENT_INTEGRATION.md).

## First Prompt To Try

Ask your MCP-capable assistant:

```text
Use selenium-mcp to open Chrome, navigate to https://example.com, read the page title, take a screenshot, and close the browser.
```

Expected tool flow:

1. `start_browser`
2. `navigate`
3. `get_title`
4. `take_screenshot`
5. `stop_browser`

## Implemented Tools

- `start_browser`
- `open_url`
- `navigate`
- `find_element`
- `wait_for_element`
- `wait_until_visible`
- `click`
- `retry_click`
- `interact`
- `type`
- `get_text`
- `get_attribute`
- `assert_text`
- `assert_visible`
- `assert_attribute`
- `press_key`
- `take_screenshot`
- `get_current_url`
- `get_title`
- `get_page_source`
- `execute_script`
- `upload_file`
- `window`
- `frame`
- `alert`
- `add_cookie`
- `get_cookies`
- `delete_cookie`
- `stop_browser`

## MCP Resources

- `browser-status://current`
- `accessibility://current`

## Documentation

- [Tool reference](docs/TOOL_REFERENCE.md)
- [Client integration](docs/CLIENT_INTEGRATION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Development guide](docs/DEVELOPMENT.md)

## Development

```bash
npm run typecheck
npm run build
npm test
```

## License

MIT. See [LICENSE](LICENSE).
