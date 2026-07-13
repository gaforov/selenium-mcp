# Usage Guide — Prompts & Recipes

A practical guide to getting real work done with selenium-mcp (v0.2.1, 39 tools) in any
MCP agent — Copilot, Claude, Cursor, Windsurf, Goose.

**You don't call tools by name.** You describe the goal in plain language and the agent
picks the tools. Every example below is a prompt you can paste and adapt. The examples
use public demo sites so you can try them immediately:

- [saucedemo.com](https://www.saucedemo.com) — a login + shopping-cart demo store
- [the-internet.herokuapp.com](https://the-internet.herokuapp.com) — classic QA sandbox (iframes, dropdowns, dynamic loading)
- [example.com](https://example.com) — a trivial static page

For exact parameters, see the [Tool Reference](TOOL_REFERENCE.md). For per-client setup,
see [Client Integration](CLIENT_INTEGRATION.md).

> **Tip:** switch your client to **Agent mode** — MCP tools only run there. If you have
> several MCP servers enabled, name this one: *"using the **selenium** tools, …"*.

---

## Key tools & when to use them

These are worth calling out explicitly in your prompts — they unlock the workflows that
make this server more than a thin WebDriver wrapper.

### `capture_page` — see the page structure

Snapshots the page and returns interactive elements with **stable refs** (`e1`, `e2`, …),
so the agent can act on what's actually there instead of guessing CSS selectors.

- **When:** you want the agent to identify elements, build a page object, or debug a
  locator that isn't matching.

```
"Open https://www.saucedemo.com, capture the page, and show me the inputs and buttons."
"Capture this page so we can build a page object."
"What's actually visible on this page right now?"
```

**What happens:** the agent returns a structured list and acts on the refs:

```
e1: input#user-name      — text input, visible
e2: input#password       — password input, visible
e3: input#login-button   — "Login", visible, enabled
```

It then uses those refs for follow-up actions, or hands you exact `By` locators for your
page objects.

### `selector_hint_*` — remember what works

Persist working selectors per domain so repeat runs get faster and more reliable. **No
other Selenium MCP server has this.**

- **When:** you automate the same site repeatedly and don't want the agent re-discovering
  the same locators every time.

```
"Save the login button selector for saucedemo.com as a hint named 'login_btn'."
"What selector hints do we have saved for saucedemo.com?"
"Reuse the saved login hints for this site."
```

**What happens:** `selector_hint_save` stores it; later `selector_hint_get` /
`selector_hint_list` retrieve it, skipping rediscovery. `selector_hint_delete` clears one.

### `batch_execute` — multi-step in one shot

Chains **up to 10 actions** (navigate, click, type, wait, execute_script, …) in a single
call. Cuts round-trips — and, on metered assistants, credits.

- **When:** a known, linear flow such as login, form fill, or a navigation sequence.

```
"In one batch: go to saucedemo.com, type 'standard_user' into the username field,
 'secret_sauce' into the password, click login, and wait for the inventory list."
```

**What happens:** the agent sends the whole sequence as one `batch_execute` call instead
of a chat round-trip per step. Set stop-on-error to halt the batch on the first failure.

### `session_*` — multiple browsers at once

Create, select, list, and destroy **independent** browser sessions, each with its own
cookies and login state.

- **When:** testing multi-user interactions (chat, permissions, hand-offs) or comparing
  two states side by side.

```
"Open two sessions: log in as 'standard_user' in session 1 and 'problem_user' in
 session 2, then compare what each sees on the inventory page."
```

**What happens:** `session_create` opens another browser; `session_select` switches which
one your commands drive; `session_list` shows them; `session_destroy` closes one.

### `assert_text` / `assert_visible` / `assert_attribute` — verify state

Built-in assertions that pass or fail with clear messages — this is what makes the server
usable as a real test runner, not just a driver.

- **When:** verifying expected state during exploration, or writing acceptance criteria.

```
"Assert the page title contains 'Swag Labs'."
"Assert the cart badge is visible after adding an item."
"Assert the error message equals 'Epic sadface: Username is required'."
```

**Match modes:** `equals`, `contains`, `matches` (regex).

### `wait_for_element` / `wait_until_visible` — reliable timing

Wait for an element to exist (optionally to be visible) before acting — the right way to
handle slow or dynamically loaded pages.

- **When:** content loads asynchronously (spinners, lazy lists, SPA transitions).

```
"Wait for the inventory list to load before counting the products."
"Go to the-internet.herokuapp.com/dynamic_loading/1, start it, and wait until the
 'Hello World!' text is visible."
```

### `retry_click` — handle flaky elements

Retries a click when elements go stale or get intercepted by overlays/animations.

- **When:** a normal click fails due to timing — spinners, loading overlays, transitions.

```
"Click the save button — it might be behind a loading overlay, retry if it fails."
```

**Config:** up to **10 attempts** with a configurable delay between them (default 250 ms).

### `window` — tabs & windows

List, switch, open, or close browser tabs and windows.

- **When:** the app opens links in new tabs, or you're testing multi-tab workflows.

```
"A new tab opened — switch to it."
"List all open tabs."
"Close this tab and go back to the first one."
```

### `frame` — iframe switching

Switch focus into or out of iframes (common in embedded widgets, rich-text editors,
payment fields, modals).

- **When:** elements are inside an iframe and normal selectors can't find them.

```
"Go to the-internet.herokuapp.com/iframe and type into the rich-text editor inside the frame."
"Switch back to the main page content."
```

---

## Tools that just work (you rarely name these)

For everyday actions, just describe what you want — the agent reaches for the right tool
automatically.

| Tool | The agent uses it when you say… |
|---|---|
| `start_browser` / `stop_browser` | "Open Chrome…", "Close the browser" |
| `open_url` / `navigate` | "Go to…" |
| `click` / `type` / `press_key` | "Click…", "Type…", "Press Enter" |
| `get_text` / `get_attribute` | "What does it say?", "Is it disabled?" |
| `get_title` / `get_current_url` | "What page am I on?" |
| `get_page_source` | "Show me the HTML" |
| `find_element` | "Find the search box and describe it" |
| `interact` | "Hover over…", "Right-click…", "Double-click…" |
| `upload_file` | "Upload this file to the file input" |
| `alert` | "Accept the alert", "Dismiss the popup", "Read the dialog text" |
| `add_cookie` / `get_cookies` / `delete_cookie` | "Set this cookie", "Clear cookies" |
| `take_screenshot` | "Take a screenshot" |

---

## Workflows

### Explore, then generate a test (the SDET core loop)

The biggest win: let the agent drive a real browser first, then write the test from what
actually worked — real selectors, real waits, real assertions — instead of guessing.

```
1. "Log in to https://www.saucedemo.com as standard_user / secret_sauce, add the first
    product to the cart, and confirm the cart badge shows 1."

2. "Now write that exact flow as a Java + Selenium + JUnit test, using the selectors and
    waits you just used."
```

Because the agent physically executed the flow, the generated test uses locators known to
work. It's language-agnostic — ask for Python/pytest, TypeScript, or C#/NUnit instead.
Your existing framework stays untouched; the server drives a separate browser.

### Building a page object

```
1. Navigate to the page.
2. capture_page  → the agent sees all elements with their selectors.
3. The agent drafts the page class with exact By locators.
4. You review and apply.
```

```
"Go to the saucedemo.com login page, capture it, and draft a LoginPage.java page object
 with the username field, password field, and login button."
```

### Exploratory testing via chat

```
"Start a browser and go to https://www.saucedemo.com.
 Log in as standard_user / secret_sauce.
 Sort products by price, low to high.
 Add the cheapest item to the cart.
 Take a screenshot and confirm the cart shows 1 item."
```

Each line becomes one or more tool calls. You stay in control; the agent executes.

### Debugging a failing test

```
"Start a browser in headed mode.
 Go to the page where our LoginTest fails.
 Capture the page and show me what's there.
 Is the login button enabled or disabled? Check its attributes.
 What does any error message say?"
```

The agent reproduces the issue live and reports what it sees — far faster than reading a
stack trace.

---

## Tips

- Ask for a `take_screenshot` whenever you want visual confirmation of a step.
- Enable [tracing](../README.md#optional-tracing) (`SELENIUM_MCP_TRACE=true`) to get an
  NDJSON log of every tool call for debugging or auditing.
- Save selector hints for sites you automate often — the second run is faster and steadier.
- For a full parameter reference, see [TOOL_REFERENCE.md](TOOL_REFERENCE.md).
