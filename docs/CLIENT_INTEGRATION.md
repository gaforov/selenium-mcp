# Client Integration

This server runs locally over MCP stdio. Your AI client starts the Node process, then calls Selenium tools through MCP. Your app under test can be Java, TestNG, JUnit, JavaScript, Python, or anything else; the MCP server is separate from your test project.

> **Both human- and AI-readable.** Each section below is self-contained with the exact
> command, config-file location, and config key for that client. If you're not sure how
> to wire this up, paste this repo's URL — `https://github.com/gaforov/selenium-mcp` — or
> this file into your AI assistant and ask it to "configure this MCP server for my IDE and
> OS." The npm package is `@gaforov/selenium-mcp`; run it with `npx -y @gaforov/selenium-mcp@latest`.

> **Agent mode is required for GitHub Copilot.** In both VS Code and JetBrains, Copilot
> only calls MCP tools in **Agent mode** — switch the chat mode dropdown to *Agent*, then
> enable the server in the tools picker (see the Copilot sections below).

## Build From Source

```bash
git clone https://github.com/gaforov/selenium-mcp.git
cd selenium-mcp
npm install
npm run build
```

Use this command in clients when running from a local checkout:

```text
node /absolute/path/to/selenium-mcp/dist/server.js
```

After npm publish, use this command instead:

```text
npx -y @gaforov/selenium-mcp@latest
```

## IntelliJ IDEA

IntelliJ has **two separate MCP entry points**, and they use different config formats. Pick the one that matches the assistant you use.

### JetBrains AI Assistant (native MCP plugin)

IntelliJ IDEA 2026.1 includes the bundled MCP Server plugin. Go to **Settings** → **Tools** → **MCP Server**, enable it, and accept the warning if shown. If IntelliJ opens or offers an `mcp.json` client settings file, paste the configuration there. This path uses the `mcpServers` key:

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

For a local checkout, replace `command`/`args` with the `node /absolute/path/to/selenium-mcp/dist/server.js` form.

### GitHub Copilot plugin (in IntelliJ)

If you drive Copilot Chat instead, this is a Copilot feature and uses **Copilot's** format, not the JetBrains one. Go to **Settings** → **Tools** → **GitHub Copilot** → **Model Context Protocol (MCP)** → **Configure**, which opens an `mcp.json`. This path uses the `servers` key with `"type": "stdio"`:

```json
{
  "servers": {
    "selenium": {
      "command": "npx",
      "args": ["-y", "@gaforov/selenium-mcp@latest"],
      "type": "stdio"
    }
  }
}
```

Then **enable it in Copilot Chat**: switch the chat mode dropdown to **Agent**, open the
tools picker (the **Tools** / wrench icon), tick **selenium**, and click **Start** if it
shows as stopped. The 39 tools then become callable.

Either way, your Java/TestNG or Java/JUnit project stays unchanged. The assistant uses MCP tools to control a real browser while you keep writing tests in IntelliJ.

## VS Code (GitHub Copilot)

GitHub Copilot's Agent mode supports MCP. It's two steps: add the server, then enable it.

**1. Add the server.** The quickest way is the CLI:

```bash
code --add-mcp '{"name":"selenium","command":"npx","args":["-y","@gaforov/selenium-mcp@latest"]}'
```

Or create `.vscode/mcp.json` in your workspace (Copilot uses the `servers` key with `"type": "stdio"`):

```json
{
  "servers": {
    "selenium": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@gaforov/selenium-mcp@latest"]
    }
  }
}
```

For a local checkout, use `"command": "node"` with `"args": ["/absolute/path/to/selenium-mcp/dist/server.js"]`.

**2. Enable it in Copilot Chat.** Open the Copilot Chat panel, switch the mode dropdown to
**Agent**, click the **Tools** (wrench) icon, and tick **selenium**. If the server shows as
stopped, click **Start**. The 39 tools now appear in the picker and Copilot can call them.

## Cursor

Add to your Cursor MCP configuration, commonly `.cursor/mcp.json`:

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

For npm:

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

## Claude Desktop

Add to your Claude Desktop MCP configuration:

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

For local development, replace `command` and `args` with the local `node .../dist/server.js` form.

## Claude Code

After npm publish:

```bash
claude mcp add selenium-mcp -- npx -y @gaforov/selenium-mcp@latest
```

From a local checkout:

```bash
claude mcp add selenium-mcp -- node /absolute/path/to/selenium-mcp/dist/server.js
```

## Goose

After npm publish:

```bash
goose session --with-extension "npx -y @gaforov/selenium-mcp@latest"
```

## Windsurf And Other MCP Clients

Most MCP clients accept the same stdio JSON shape:

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

## First-Run Verification

Ask your assistant:

```text
Use selenium-mcp to start Chrome, open https://example.com, read the page title, take a screenshot, and close the browser.
```

Expected tools:

1. `start_browser`
2. `navigate`
3. `get_title`
4. `take_screenshot`
5. `stop_browser`

## Troubleshooting

- Confirm Node.js 20+ is installed: `node --version`
- Confirm the project is built when using local `dist/server.js`: `npm run build`
- Use `node`, not `npm run start`, inside MCP configs for local checkout usage
- Use `npx -y @gaforov/selenium-mcp@latest` after npm publish
- Do not write logs to stdout in stdio MCP servers; this project logs to stderr
- If PowerShell blocks `npm.ps1`, run `npm.cmd run build` or use a terminal with script execution enabled
