# Publishing and Listing Guide

This guide covers publishing selenium-mcp to GitHub, npm, and MCP directories.

## 1) Publish source to GitHub

1. Create a public GitHub repository.
2. Push this project.
3. Ensure README and LICENSE are present.

## 2) Publish package to npm (recommended)

This enables one-command installs from MCP clients.

Example release flow:

```bash
npm login
npm version patch
npm publish --access public
```

If using a scoped package name, keep --access public for public packages.

After publish, users can configure MCP clients with:

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

## 3) MCP directory listing (Glama and similar)

Important:

- Public GitHub visibility alone may not guarantee immediate listing in all directories.
- Some directories index automatically, but indexing speed and coverage vary.

Recommended:

1. Submit manually through directory listing flows.
2. For Glama, use the Add Server action on the servers page.
3. Claim/verify ownership when available.
4. Re-check listing metadata after submission (license, platform, install command, tool count).

## 4) Keep install docs current

After first npm release:

- Replace placeholder package names in README and docs/CLIENT_INTEGRATION.md.
- Add a quick install snippet for your exact published package.

## 5) Suggested release checklist

- npm run typecheck passes
- npm run build passes
- README setup section includes copy-paste config
- License is present
- Tool reference docs are current
- Directory submissions completed
