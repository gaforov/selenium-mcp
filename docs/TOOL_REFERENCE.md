# Tool Reference

This document describes tools currently implemented in selenium-mcp.

## Shared selector contract

Tools that interact with elements use this selector object:

```json
{
  "by": "css | xpath | id | name | className | tagName | linkText | partialLinkText",
  "value": "string"
}
```

Shared timeout contract:

- timeoutMs: integer, default 10000, min 100, max 60000

## Tool: start_browser

Description:

- Starts a Selenium browser session.

Input schema:

```json
{
  "browser": "chrome | firefox | edge (default: chrome)",
  "headless": "boolean (default: false)"
}
```

Success response includes structured status:

- running
- browser
- headless
- startedAt

## Tool: open_url

Description:

- Navigates the active browser to a URL.

Input schema:

```json
{
  "url": "valid URL"
}
```

Success response includes:

- currentUrl
- title

## Tool: click

Description:

- Waits for an element to become visible and enabled, then clicks it.

Input schema:

```json
{
  "selector": { "by": "css", "value": "#submit" },
  "timeoutMs": 10000
}
```

Failure payload includes selector and timeout context.

## Tool: type

Description:

- Waits for element visibility, optionally clears, types text, optionally submits with Enter.

Input schema:

```json
{
  "selector": { "by": "id", "value": "email" },
  "text": "user@example.com",
  "clearFirst": true,
  "submit": false,
  "timeoutMs": 10000
}
```

Success payload includes:

- typedLength
- clearFirst
- submit
- selector and timeout details

## Tool: get_text

Description:

- Waits for element visibility and returns element text.

Input schema:

```json
{
  "selector": { "by": "xpath", "value": "//h1" },
  "timeoutMs": 10000,
  "trim": true
}
```

Success payload includes:

- text
- trim
- selector and timeout details

## Tool: stop_browser

Description:

- Stops active browser session if it exists.

Input schema:

- No input arguments.

Success response includes final status snapshot.

## Error semantics

All tool handlers follow a consistent pattern:

- Return content text for both success and failure
- Set isError to true on failures
- Include structuredContent for machine-readable context when applicable
