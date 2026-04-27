# Client Integration

This MCP server is language-agnostic and client-agnostic.

You can keep your test automation stack in Java + TestNG while using this MCP server from an AI host in IntelliJ or other MCP-capable clients.

## Important concept

- The MCP server runtime language (TypeScript/Node.js) is independent from your test project language (Java/TestNG).
- Your AI client calls MCP tools; your Java codebase does not need to be converted.

## Local run options

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm run start
```

Use build/start mode for stable client integrations.

## Generic MCP client configuration

Use your client's MCP server settings to launch this server with one of these commands:

Option A (built output):

- command: node
- args: ["D:/VSCodeProjects/selenium-mcp/dist/server.js"]

Option B (development runtime):

- command: npx
- args: ["tsx", "D:/VSCodeProjects/selenium-mcp/src/server.ts"]

Prefer Option A for stable usage after building.

Copy-paste template (local build):

```json
{
  "mcpServers": {
    "selenium-mcp": {
      "command": "node",
      "args": ["D:/VSCodeProjects/selenium-mcp/dist/server.js"]
    }
  }
}
```

Copy-paste template (after npm publish):

```json
{
  "mcpServers": {
    "selenium-mcp": {
      "command": "npx",
      "args": ["-y", "<your-npm-package-name>@latest"]
    }
  }
}
```

## IDE and client notes

### VS Code and Cursor-style MCP clients

- Most clients use a JSON-based mcpServers config.
- Use the templates above and restart the client after editing config.

### IntelliJ workflow notes

- Configure the MCP server in your IntelliJ-compatible AI/MCP plugin.
- If the plugin uses form fields instead of JSON:
  - command: node
  - args: D:/VSCodeProjects/selenium-mcp/dist/server.js
- Keep your Java/TestNG project separate; this MCP server is external and language-independent.

## First-run verification

After configuring your client, test this sequence:

1. start_browser
2. open_url
3. click or type
4. get_text
5. stop_browser

If all calls succeed, your MCP integration is working.

## Troubleshooting

If the MCP client fails to connect:

- Ensure Node.js 20+ is installed
- Confirm build artifacts exist when using dist/server.js
- Verify no process writes logs to stdout
- Check stderr logs for startup errors
- If using npm package mode, confirm package name and version are correct
