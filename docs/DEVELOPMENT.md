# Development Guide

## Prerequisites

- Node.js 20+
- npm
- Chrome, Firefox, or Edge installed (the end-to-end tests use Chrome)

## Setup

```bash
npm install
```

## Commands

```bash
npm run typecheck
npm run build
npm test            # unit tests, no browser needed
npm run test:e2e    # end-to-end tests in headless Chrome
npm run dev
npm run start
```

## Coding conventions

- Keep one concern per tool file in src/tools
- Use zod input schemas on every tool, with a description on the tool and on every parameter
- Reuse shared contracts in src/tools/shared when possible
- Keep server bootstrap logic in src/server.ts only
- Return MCP-compatible content responses with isError on failure
- Use stderr logging only for stdio servers
- Keep package metadata and client setup docs current when npm behavior changes

## Adding a new tool

Follow the checklist in [AGENTS.md](../AGENTS.md): it covers when a new tool is justified,
registration, descriptions, the end-to-end test, and every doc to update.

## Documentation workflow

When behavior changes:

1. Update README.md for high-level changes
2. Update docs/TOOL_REFERENCE.md for contract changes
3. Update docs/ARCHITECTURE.md when runtime flow or module boundaries change
4. Update docs/CLIENT_INTEGRATION.md when setup or client behavior changes

## Release readiness checklist

- typecheck passes
- build passes
- unit and end-to-end tests pass
- npm pack --dry-run includes dist/server.js and public docs only
- server starts in stdio mode
- tool contracts documented
- license and README are current
