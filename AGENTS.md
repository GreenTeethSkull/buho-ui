# AGENTS.md — Lucy (buho-ui)

**Project:** Copiloto SRE Agents — Dynatrace App  
**Codebase:** `buho-ui`

## Identity

This is a Dynatrace custom application that embeds a chat copilot powered by Microsoft Copilot Studio inside the Dynatrace platform. The app provides an AI assistant (Lucy) to SREs, connecting chat messages through Power Automate webhooks to Copilot Studio, with conversation persistence via Dynatrace Documents API and logging via Dynatrace Logs API.

## Quick Start

```bash
git clone git@github.com:GreenTeethSkull/buho-ui.git
cd buho-ui
npm install
npm start        # dev server with hot reload
npm run build    # production build
npm run lint     # eslint
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18, TypeScript 5.9 |
| Design System | `@dynatrace/strato-components` v3.5, `@dynatrace/strato-design-tokens` |
| Routing | React Router DOM v6 |
| Markdown | `react-markdown` v10 + `remark-gfm` v4 |
| Backend | Dynatrace App Functions (serverless per-file) |
| Bot Protocol | Microsoft Bot Framework Direct Line v3 / Power Automate Webhook |
| Persistence | Dynatrace Documents API (`@dynatrace-sdk/client-document`) |
| Logging | Dynatrace Logs API v2 (`@dynatrace-sdk/client-logs`) |
| Build | `dt-app` CLI v1.9.0 (Dynatrace App Toolkit) |
| Lint | ESLint 9 flat config |
| Testing | None — no framework, no tests |

## Architecture

```
Browser (Dynatrace iframe)
  └── React App (ui/)
        ├── App.tsx — page shell, routing, AppShellProvider
        ├── pages/chat/Chat.tsx — main chat orchestrator
        │     ├── ChatInput.tsx — textarea with auto-resize
        │     ├── ChatMessage.tsx — message bubble (Markdown)
        │     ├── ChatSidebar.tsx — conversation history
        │     └── EmptyChat.tsx — empty state with prompts
        ├── hooks/
        │     ├── useAppShell.tsx — global state (sidebar, model)
        │     ├── useChatSession.ts — core orchestration
        │     ├── useConversationManager.ts — CRUD via Documents
        │     ├── useAppFunctionExecutor.ts — wrapper for App Functions
        │     └── useDocumentPersistence.ts — generic doc loader
        └── services/logService.ts — send logs to Dynatrace

Serverless (api/)
  ├── copilot-webhook.function.ts — send to Power Automate
  ├── copilot-directline-token.function.ts — Direct Line tokens
  ├── copilot-directline-conversation.function.ts — convos
  ├── copilot-directline-send-activity.function.ts — send
  ├── copilot-directline-activities.function.ts — poll bot
  └── copilot-directline.shared.ts — shared types/validators
```

## Key Patterns

1. **All styling is inline `style` props** — no CSS files, no Tailwind, no CSS-in-JS. Colors come from `@dynatrace/strato-design-tokens` (auto light/dark).
2. **Strato-only imports** — eslint enforces sub-package imports (`@dynatrace/strato-components` not `@dynatrace/strato-components-preview` for restricted ones).
3. **Context-based global state** — `useAppShell.tsx` provides sidebar toggle, model selection, model list via React Context.
4. **Hooks as single-responsibility units** — each hook does one thing; composable.
5. **App Functions are standalone** — no shared runtime, each `.function.ts` deployed independently.
6. **Documents as conversation store** — type `sre.copilot.agents`, optimistic locking (version field), soft-delete by changing type to `sre.copilot.agents.trash`.
7. **No secrets in code** — Direct Line secret stored in Dynatrace Credential Vault (`runtime/integrations/vault.client.ts`).

## Important Constraints

- **No arbitrary npm packages** — the Dynatrace platform restricts what modules can run server-side. Only SDK-provided APIs.
- **Strato components only** — do not import MUI, Chakra, or other design systems.
- **Spanish commit messages** — convention is Spanish, loosely following `feat:`/`refactor:`/`fix:` prefixes.
- **No testing infrastructure** — if tests are needed, set up the framework first (Vitest recommended for Vite compatibility).
- **Branch is `feature/ui-redesing`** — active development happens here, merges into `master`.

## Coding Guidelines

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

### 5. Continue Until A Useful Stop

Once the task is clear and you have enough access, continue until one of these is true:
- The task is complete and verified.
- A planned milestone is complete and the next step needs a real user decision.
- You are blocked by credentials, permissions, destructive risk, unavailable services, or missing information that cannot be discovered.
- Validation failed and you have investigated enough to explain the concrete cause and next action.
- Continuing would expand the scope beyond the user's objective.

Do not pause only because: you finished a plan, more files need inspection, tests need to run, the task is long, or the next step is obvious. If you pause, state the exact blocker, what was done, what remains, and what input is needed.

## Routing Rules

1. When working on this project, read this AGENTS.md first.
2. No loose files at project root beyond what already exists.
