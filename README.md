# selenium-mcp

Selenium MCP server for AI agents — **38 tools** for real-browser automation: navigation, clicking, typing, assertions, screenshots, multi-session management, page snapshots with stable element refs, persistent selector hints, and batched multi-step execution.

[![npm version](https://img.shields.io/npm/v/%40gaforov%2Fselenium-mcp)](https://www.npmjs.com/package/@gaforov/selenium-mcp)
[![npm downloads](https://img.shields.io/npm/dw/%40gaforov%2Fselenium-mcp)](https://www.npmjs.com/package/@gaforov/selenium-mcp)
[![CI](https://github.com/gaforov/selenium-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/gaforov/selenium-mcp/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/%40gaforov%2Fselenium-mcp)](LICENSE)
[![node](https://img.shields.io/node/v/%40gaforov%2Fselenium-mcp)](package.json)

Built with TypeScript, the official MCP SDK, and Selenium WebDriver — strict zod input validation, explicit waits, and structured responses designed for LLM agents.

### One-Click Install

[![Install in Cursor](https://img.shields.io/badge/Cursor-Install_MCP_Server-black?style=flat-square)](https://cursor.com/en/install-mcp?name=selenium-mcp&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBnYWZvcm92L3NlbGVuaXVtLW1jcEBsYXRlc3QiXX0%3D)
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_MCP_Server-0098FF?style=flat-square)](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522selenium-mcp%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522-y%2522%252C%2522%2540gaforov%252Fselenium-mcp%2540latest%2522%255D%257D)
[![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_MCP_Server-24bfa5?style=flat-square)](https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522selenium-mcp%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522-y%2522%252C%2522%2540gaforov%252Fselenium-mcp%2540latest%2522%255D%257D)

## Setup

<details open>
<summary><strong>Claude Code</strong></summary>

```bash
claude mcp add selenium -- npx -y @gaforov/selenium-mcp@latest
```
</details>

<details>
<summary><strong>Claude Desktop / Cursor / Windsurf / other MCP clients</strong></summary>

Add to your client's MCP config (e.g. `claude_desktop_config.json` or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "selenium": {
      "command": "npx",
      "args": ["-y", "@gaforov/selenium-mcp@latest"]
    }
  }
}
```
</details>

<details>
<summary><strong>VS Code</strong></summary>

```bash
code --add-mcp '{"name":"selenium","command":"npx","args":["-y","@gaforov/selenium-mcp@latest"]}'
```
</details>

<details>
<summary><strong>Goose</strong></summary>

```bash
goose session --with-extension "npx -y @gaforov/selenium-mcp@latest"
```
</details>

<details>
<summary><strong>IntelliJ IDEA / JetBrains IDEs</strong></summary>

Settings → Tools → AI Assistant → Model Context Protocol → Add, with command `npx` and arguments `-y @gaforov/selenium-mcp@latest`. Full walkthrough in [docs/CLIENT_INTEGRATION.md](docs/CLIENT_INTEGRATION.md).
</details>

<details>
<summary><strong>From source</strong></summary>

```bash
git clone https://github.com/gaforov/selenium-mcp.git
cd selenium-mcp
npm install
npm run build
```

Then point your MCP client at `node /absolute/path/to/selenium-mcp/dist/server.js`.
</details>

## Example Usage

Ask your AI agent:

> Use selenium-mcp to open Chrome, go to https://example.com, read the page title, take a screenshot, and close the browser.

The agent chains `start_browser` → `navigate` → `get_title` → `take_screenshot` → `stop_browser` on its own — no scripting needed.

## Requirements

- Node.js 20+
- Chrome, Firefox, or Edge installed (Selenium Manager provisions the matching driver automatically)

## Why selenium-mcp

- **Snapshot-first workflows** — `capture_page` returns a page snapshot with stable element refs the agent can act on directly, no brittle selector guessing
- **Selector hints** — persist working locators per domain so repeat automations get faster and more reliable over time
- **Batched execution** — `batch_execute` runs constrained multi-step sequences in a single tool call, cutting round-trips
- **Multi-session** — create, select, list, and destroy parallel browser sessions
- **Agent-friendly errors** — every response is structured and validated with zod, so agents can recover instead of stalling
- **Optional tracing** — NDJSON trace of every tool call for debugging and auditing

## Tools (38)

| Category | Tools |
|---|---|
| Browser lifecycle | `start_browser`, `stop_browser`, `session_create`, `session_select`, `session_list`, `session_destroy` |
| Navigation | `open_url`, `navigate`, `get_current_url`, `get_title` |
| Element discovery | `find_element`, `wait_for_element`, `wait_until_visible`, `capture_page`, `get_page_source` |
| Interaction | `click`, `retry_click`, `interact` (hover/double/right-click), `type`, `press_key`, `upload_file` |
| Reading | `get_text`, `get_attribute` |
| Assertions | `assert_text`, `assert_visible`, `assert_attribute` |
| Scripting | `execute_script`, `batch_execute` |
| Selector hints | `selector_hint_save`, `selector_hint_get`, `selector_hint_list`, `selector_hint_delete` |
| Windows & context | `window`, `frame`, `alert` |
| Cookies | `add_cookie`, `get_cookies`, `delete_cookie` |
| Capture | `take_screenshot` |

Full parameter documentation: [docs/TOOL_REFERENCE.md](docs/TOOL_REFERENCE.md)

## MCP Resources

- `browser-status://current` — live browser/session status
- `accessibility://current` — accessibility snapshot of the current page

## Optional Tracing

Enable lightweight NDJSON tracing of all tool calls:

```bash
SELENIUM_MCP_TRACE=true
SELENIUM_MCP_TRACE_PATH=./logs/selenium-mcp-trace.ndjson
```

If `SELENIUM_MCP_TRACE_PATH` is omitted, the default is `logs/selenium-mcp-trace.ndjson`.

## Documentation

- [Tool reference](docs/TOOL_REFERENCE.md)
- [Client integration](docs/CLIENT_INTEGRATION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Development guide](docs/DEVELOPMENT.md)
- [Changelog](CHANGELOG.md)

## Contributing

Contributions are welcome — bug reports, feature requests, and pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

```bash
npm run typecheck
npm run build
npm test
```

## License

MIT. See [LICENSE](LICENSE).
