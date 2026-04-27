# Architecture

selenium-mcp is a TypeScript MCP server using stdio transport and a modular tool layout.

## High-level structure

- src/server.ts: Server bootstrap, transport connection, signal handling
- src/driver/driverManager.ts: Browser session lifecycle and WebDriver construction
- src/tools/index.ts: Tool registration composition root
- src/tools/\*.ts: One module per tool
- src/tools/shared/\*.ts: Reusable selector and wait abstractions
- src/utils/toolResult.ts: Unified tool response helpers

## Runtime flow

1. Process starts and creates McpServer
2. Tool modules are registered
3. Server connects via StdioServerTransport
4. MCP client invokes tools over JSON-RPC
5. Tool validates input, executes browser action, returns MCP response
6. On SIGINT/SIGTERM/fatal error, server attempts graceful shutdown

## Design principles

- Single-responsibility modules
- Validation at MCP boundaries with zod
- Strict TypeScript and explicit types
- Explicit waits over sleeps
- No stdout logging for stdio transport integrity

## Session model

Current model:

- Single active browser session managed by driverManager
- start_browser must be called before browser-dependent tools
- stop_browser safely quits and resets state

Planned evolution:

- Optional multi-session support in a future phase

## Reliability model

Current reliability mechanisms:

- Visibility/clickability waits for interaction tools
- Structured error payloads with selector and timeout context
- Graceful process shutdown

Planned reliability additions:

- wait_for_element
- wait_until_visible
- retry_click
