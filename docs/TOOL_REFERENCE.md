# Tool Reference

## Selector Contract

Element tools use this selector object:

```json
{
  "by": "css | xpath | id | name | class | className | tag | tagName | linkText | partialLinkText",
  "value": "string"
}
```

Shared timeout:

- `timeoutMs`: integer, default `10000`, min `100`, max `60000`

## Browser Lifecycle

### start_browser

Starts Chrome, Firefox, or Edge.

```json
{
  "browser": "chrome",
  "headless": false,
  "browserArgs": ["--disable-gpu"],
  "pageLoadTimeoutMs": 30000,
  "scriptTimeoutMs": 30000,
  "windowSize": { "width": 1440, "height": 900 }
}
```

### stop_browser

Stops the current browser session.

## Navigation And Page Info

- `open_url`: navigate to a URL
- `navigate`: alias-friendly URL navigation
- `get_current_url`: return current URL
- `get_title`: return page title
- `get_page_source`: return page source with optional truncation

## Element Discovery And Waits

- `find_element`: locate an element and return metadata
- `wait_for_element`: wait for existence, optionally visibility
- `wait_until_visible`: wait for visibility

Example:

```json
{
  "selector": { "by": "css", "value": "#submit" },
  "timeoutMs": 10000
}
```

## Element Interaction

- `click`: wait until visible/enabled, then click
- `retry_click`: retry transient click failures
- `interact`: `click`, `double_click`, `right_click`, or `hover`
- `type`: clear/type text and optionally submit with Enter
- `press_key`: press a key against the active element
- `upload_file`: send an absolute file path to a file input

Ref-aware targeting:

- `click`, `interact`, `type`, and `get_text` accept either `selector` or `ref`
- `ref` values come from `capture_page` results (`e1`, `e2`, ...)

Type example:

```json
{
  "selector": { "by": "id", "value": "email" },
  "text": "user@example.com",
  "clearFirst": true,
  "submit": false,
  "timeoutMs": 10000
}
```

## Reading Data

- `get_text`: read visible text
- `get_attribute`: read an element attribute/property
- `take_screenshot`: capture PNG screenshot, optionally save to absolute `savePath` (directories auto-created), and optionally return base64
- `capture_page`: capture visible interactive/headline elements with stable refs and reusable selectors
- `execute_script`: run synchronous JavaScript in the page

## Batch Execution

- `batch_execute`: execute up to 10 steps in one call for short flows
- Supported step actions:
  - `navigate`
  - `wait_for_element`
  - `click`
  - `type`
  - `execute_script`
- `stopOnError` defaults to `true` to keep behavior predictable

Batch step example:

```json
{
  "steps": [
    { "action": "navigate", "url": "https://example.com" },
    {
      "action": "wait_for_element",
      "selector": { "by": "css", "value": "h1" },
      "visible": true,
      "timeoutMs": 10000
    }
  ],
  "stopOnError": true
}
```

## Assertions

- `assert_text`: assert visible text `equals`, `contains`, or `matches`
- `assert_visible`: assert an element becomes visible
- `assert_attribute`: assert an attribute/property `equals`, `contains`, or `matches`

## Browser Context

- `window`: `list`, `switch`, `switch_latest`, `new_tab`, `new_window`, `close`
- `frame`: `switch`, `parent`, `default`
- `alert`: `get_text`, `accept`, `dismiss`, `send_text`
- `add_cookie`: add one cookie
- `get_cookies`: read one or all cookies
- `delete_cookie`: delete one or all cookies

## Session Management

- `session_create`: create a new browser session and select it as active
- `session_select`: switch active context to an existing session
- `session_list`: list all active sessions and active session id
- `session_destroy`: destroy a specific session

Notes:

- Existing tools always run against the active session.
- `start_browser` keeps single-session default behavior.
- For multi-session workflows, use `session_create` and `session_select`.

## Selector Hints

- `selector_hint_save`: persist a named selector for a domain
- `selector_hint_get`: resolve a saved selector by key/domain
- `selector_hint_list`: list saved selectors, optionally by domain
- `selector_hint_delete`: remove a saved selector

Hints are stored in `.selenium-mcp/selector-hints.json` by default.
Override path with `SELENIUM_MCP_SELECTOR_HINTS_PATH`.

## MCP Resources

### browser-status://current

Returns JSON status for the current browser session.

### accessibility://current

Returns a compact JSON snapshot of visible headings and interactive elements.

## Error Semantics

Tool failures return:

- `isError: true`
- Human-readable text content
- Structured context such as selector, timeout, attempted action, or URL when useful

## Optional Tracing

Enable per-tool trace output with environment variables:

- `SELENIUM_MCP_TRACE=true`
- `SELENIUM_MCP_TRACE_PATH=/absolute/or/relative/path/to/trace.ndjson` (optional)

Trace records include timestamp, tool name, duration, success/failure, sanitized input, and summarized output.
