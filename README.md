# selenium-mcp

Selenium MCP server built with TypeScript and a modular architecture.

This repository is designed for reliability, maintainability, and AI-friendly tool contracts.

## Highlights

- MCP stdio server using official TypeScript SDK patterns
- Strict TypeScript + zod validation at tool boundaries
- Explicit wait abstractions for resilient UI interactions
- Structured tool responses for both humans and LLM hosts
- Public MIT license for personal, academic, and commercial use

## Implemented tools

- start_browser
- open_url
- click
- type
- get_text
- stop_browser

## Quick start

Requirements:

- Node.js 20+
- Chrome, Firefox, or Edge installed

Install:

```bash
npm install
```

Run in development:

```bash
npm run dev
```

Build and run:

```bash
npm run build
npm run start
```

## Setup in MCP clients (copy-paste)

Use one of the following MCP server configurations in your client.

Local repository setup (before npm publish):

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

Npm package setup (after publish):

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

Works with:

- VS Code MCP-capable clients
- Cursor and similar MCP clients using mcpServers JSON
- IntelliJ MCP-capable plugins/clients (Java and TestNG projects supported)

For a deeper setup walkthrough, see docs/CLIENT_INTEGRATION.md.

## Publishing and directory listing

Publishing this repo to GitHub does not guarantee immediate automatic listing on MCP directories.

Recommended process:

1. Publish source to a public GitHub repository.
2. Publish package to npm for one-command install.
3. Submit/list manually on MCP directories (for example Glama) using their Add Server flow.
4. Claim/verify ownership where the directory supports it.

Detailed steps are in docs/PUBLISHING.md.

## Java and IntelliJ compatibility

This server is language-agnostic and client-agnostic.

- You can use it from IntelliJ MCP-capable AI clients.
- Your automation project can remain Java + TestNG.
- You do not need to rewrite your tests in TypeScript.

Integration details are documented in docs/CLIENT_INTEGRATION.md.

## Documentation

- docs/README.md: Documentation index
- docs/STATE.md: Current implementation status
- docs/ROADMAP.md: Planned implementation sequence
- docs/TOOL_REFERENCE.md: Tool contracts and examples
- docs/ARCHITECTURE.md: Runtime flow and module boundaries
- docs/CLIENT_INTEGRATION.md: MCP host integration guidance
- docs/PUBLISHING.md: GitHub, npm, and directory listing workflow
- docs/DEVELOPMENT.md: Contributor and development workflow

## MCP best-practice alignment

This project aligns with official MCP TypeScript server guidance:

- Uses McpServer with stdio transport
- Uses zod input schemas for tools
- Uses stderr logging for stdio safety
- Keeps server bootstrap and tool logic modular

## License

MIT. Free for personal, academic, and commercial use.

See LICENSE for the full legal text. Commercial use is explicitly permitted under MIT, including internal company usage and redistribution/sale of software including this code, provided the license notice is retained.
