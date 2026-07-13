# Usage Guide — Prompts & Recipes

A practical guide to getting the most out of selenium-mcp. You don't call tools by
name — you tell your AI agent (Copilot, Claude, Cursor, …) what you want in plain
language, and it picks the right tools. The prompts below are examples you can adapt.

For exact parameters, see the [Tool Reference](TOOL_REFERENCE.md). The examples here
use public demo sites so you can try them immediately:
[example.com](https://example.com) and [saucedemo.com](https://www.saucedemo.com)
(a standard QA practice store).

---

## The core workflow: explore, then generate tests

The biggest win for test automation is letting the agent *drive a real browser first*,
then write the test from what actually worked — real selectors, real waits, real
assertions — instead of guessing from HTML.

> **Prompt:** "Using the selenium tools, log in to https://www.saucedemo.com as
> `standard_user` / `secret_sauce`, add the first product to the cart, and confirm the
> cart badge shows 1."

> **Then:** "Now write that exact flow as a Java + Selenium + JUnit test, using the
> selectors and waits you just used."

Because the agent physically executed the flow, the generated test uses locators that
are known to work. This is language-agnostic — ask for Python/pytest, TypeScript,
C#/NUnit, or anything else. Your existing framework stays untouched; the server just
drives a separate browser.

---

## Key tools & when to use them

### `capture_page` — see the page structure

Snapshots the page and returns interactive elements with **stable refs** (`e1`, `e2`, …)
the agent can act on directly, instead of guessing CSS selectors.

- **When:** you want the agent to identify elements, build page objects, or debug a
  locator that isn't matching.

> **Prompt:** "Open https://www.saucedemo.com, capture the page, and list the input
> fields and buttons you can see."

**What happens:** the agent returns a structured list (`e1: input#user-name`,
`e2: input#password`, `e3: input#login-button`) and can then act on those refs.

### `selector_hint_*` — remember what works

Persist working selectors per domain so repeat runs get faster and more reliable. No
other Selenium MCP server has this.

- **When:** you automate the same site repeatedly and don't want the agent
  re-discovering the same locators every time.

> **Prompt:** "Save the login button selector for saucedemo.com as a hint named
> `login_btn`, then next time just reuse it."

**What happens:** `selector_hint_save` stores it; later `selector_hint_get` retrieves it,
skipping re-discovery.

### `batch_execute` — multi-step in one shot

Chains several actions (navigate, click, type, wait, assert) in a single call. Cuts
round-trips — and, on metered assistants, credits.

- **When:** a known, linear flow such as login, form fill, or a navigation sequence.

> **Prompt:** "In one batch: go to saucedemo.com, type `standard_user` into the username
> field, type `secret_sauce` into the password, click login, and assert the page URL
> contains `inventory`."

**What happens:** the agent sends the whole sequence as one `batch_execute` call.

### `session_*` — multiple browsers at once

Create, select, list, and destroy independent browser sessions, each with its own
cookies and login state.

- **When:** testing multi-user interactions (chat, permissions, hand-offs) or comparing
  two states side by side.

> **Prompt:** "Open two sessions: log in as `standard_user` in session 1 and
> `problem_user` in session 2, then compare what each sees on the inventory page."

**What happens:** `session_create` opens a second browser; `session_select` switches
which one your commands control.

### `assert_text` / `assert_visible` / `assert_attribute` — turn it into a test

Pass/fail checks that make the server usable as a real test runner, not just a driver.

> **Prompt:** "Assert that the page title contains `Swag Labs` and that the cart badge is
> visible after adding an item."

### `wait_for_element` — reliable timing

Waits for an element to exist (optionally to be visible) before acting — the right way to
handle slow or dynamically loaded pages.

> **Prompt:** "Wait for the inventory list to load before counting the products."

---

## Debugging a flaky test live

> **Prompt:** "Our test says the checkout button isn't clickable. Go to the cart page on
> saucedemo.com, capture the page, and tell me the button's state and attributes."

The agent reproduces the issue in a real browser and reports what it sees
(displayed, enabled, overlapped) — far faster than reading a stack trace.

---

## Tips

- Name the server if you have several MCP tools enabled: "using the **selenium** tools, …".
- Switch your client to **Agent mode** — MCP tools only run there.
- Ask the agent to `take_screenshot` when you want visual confirmation of a step.
- For a full parameter reference, see [TOOL_REFERENCE.md](TOOL_REFERENCE.md); for setup
  per client, see [CLIENT_INTEGRATION.md](CLIENT_INTEGRATION.md).
