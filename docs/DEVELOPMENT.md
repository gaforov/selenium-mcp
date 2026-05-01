# Development Guide

## Prerequisites

- Node.js 20+
- npm
- Chrome, Firefox, or Edge installed

## Setup

```bash
npm install
```

## Commands

```bash
npm run typecheck
npm run build
npm test
npm run dev
npm run start
```

## Coding conventions

- Keep one concern per tool file in src/tools
- Use zod input schemas on every tool
- Reuse shared contracts in src/tools/shared when possible
- Keep server bootstrap logic in src/server.ts only
- Return MCP-compatible content responses with isError on failure
- Use stderr logging only for stdio servers
- Keep package metadata and client setup docs current when npm behavior changes

## Adding a new tool

1. Create src/tools/<toolName>.ts
2. Define input schema with zod
3. Implement handler with try/catch and structured error responses
4. Register tool in src/tools/index.ts
5. Update docs/TOOL_REFERENCE.md
6. Add or update tests when shared contracts change

## Documentation workflow

When behavior changes:

1. Update README.md for high-level changes
2. Update docs/TOOL_REFERENCE.md for contract changes
3. Update docs/ARCHITECTURE.md when runtime flow or module boundaries change
4. Update docs/CLIENT_INTEGRATION.md when setup or client behavior changes

## Release readiness checklist

- typecheck passes
- build passes
- tests pass
- npm pack --dry-run includes dist/server.js and public docs only
- server starts in stdio mode
- tool contracts documented
- license and README are current
