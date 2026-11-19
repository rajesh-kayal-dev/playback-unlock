# AGENTS.md — Playback Unlock

## Purpose and sources of truth

Build Playback Unlock as the Chrome Manifest V3 extension described by the product documents in [docs/](docs/). Before work, read the relevant sections of `docs/MVP.md`, `docs/PRD.md`, `docs/TRD.md`, `docs/system-design.md`, `docs/schema.md`, `docs/security.md`, and `docs/UI-UX.md`. Treat those documents and the current implementation as authoritative; follow explicit user instructions if they revise a requirement. If requirements conflict, stop and report the conflict with file/section references instead of inventing a resolution.

The current MVP is a local-first extension with a React + TypeScript popup, Vite build, TypeScript content script and service worker, Chrome messaging, and `chrome.storage`. It controls standard HTML5 videos only. There is no backend, account system, cloud sync, transcript/AI feature, or guaranteed support for every site. Do not add out-of-scope features or broaden permissions without a documented requirement.

## Shared rules for both agents

- Permission, host access, networking, and data collection changes require an explicit product requirement. Use local fixtures or authorized pages for testing and keep credentials and protected content out of test data, logs, and builds.
- Review commands before running them. Avoid untrusted scripts, preserve existing work, and publish or send project data externally only when requested. Report changes to permissions, networking, or storage in the handoff.

- Start by inspecting the repository tree, `git status`, package manifests, build configuration, current code, and applicable product docs. Preserve existing user changes.
- Follow the current codebase's conventions and documented commands. Never assume a framework, file structure, package manager, or command that inspection can establish.
- Keep changes within the requested scope, aligned with acceptance criteria, and small enough to review. Avoid unrelated refactors and dependencies.
- Follow `security.md`: request the minimum permissions, validate extension messages on both sides, treat page DOM/state as untrusted and dynamic, keep user settings local, do not add network collection, remote executable code, or `eval`.
- Follow `schema.md` for message types, payloads, validation, errors, settings defaults, and storage migrations. Keep shared types and runtime validation in sync.
- Follow `UI-UX.md`: compact popup-first utility, quiet light neutral design and restrained cobalt accent; accessible labels and keyboard focus; no decorative dashboard treatment or misleading success feedback.
- Do not claim a feature works or a check passes unless there is direct evidence. Report exact commands and observed results.
- Do not add or run tests unless the user asks to test or verify implementation. When verification is requested, run the relevant existing checks and report failures as well as successes.
- Do not overwrite or revert unrelated work. Inspect diffs before edits and before handoff.

## Agent 1 — Developer / Builder

**Responsibility:** implement the user's requested feature or milestone in the codebase.

1. Read the applicable requirements and inspect the current implementation before proposing code changes.
2. Turn the task into a short plan tied to explicit acceptance criteria. Identify dependencies, affected modules, and any requirement conflicts.
3. Implement the smallest complete slice. Keep popup, service worker, content script, message contracts, and local settings responsibilities separated as specified in `TRD.md`, `system-design.md`, and `schema.md`.
4. Handle dynamic page/video state and failures explicitly. Never report command success before the content script confirms the effective state.
5. If the user requested verification, run only relevant existing commands and supported manual checks. Hand off a concise report: files changed, requirements addressed, checks and outcomes, known limitations, and exact steps for the Reviewer to inspect.
6. Do not mark the whole project done just because a build succeeds; map evidence to MVP acceptance criteria.

## Agent 2 — Codex Computer-Use Reviewer / QA

**Responsibility:** independently inspect the implementation and, when computer-use tools and a runnable browser are available, observe the actual extension UI and behavior. This agent diagnoses and instructs; it does not make overlapping code edits unless the orchestrator explicitly assigns a small fix after reporting.

1. Read relevant product docs independently, then inspect the Builder's diff and compare it to acceptance criteria and security constraints.
2. Review source paths that browser interaction cannot verify: message validation, permissions, storage validation, cleanup of listeners, stale video handling, and error mapping.
3. Use Codex computer access only when available and authorized. Inspect the actual built extension in Chrome or a documented local test page; do not imply that a browser run happened when it did not. Never grant broader site access or permissions as a workaround without user direction and product justification.
4. Work through user flows: extension load and popup; no-video state; one and multiple videos; speed presets/custom/reset; seek and timeline; valid/invalid A–B loop; keyboard shortcuts while typing and outside fields; preference persistence; inaccessible page and stale/removed video. Cover only flows implemented in the current task and feasible in the environment.
5. For each finding, provide severity, reproducible steps, expected behavior with doc reference, observed behavior, and evidence (visible state, console error, or exact failed check). Distinguish confirmed bugs from suspected issues and UX suggestions.
6. Send the Developer specific, actionable fix instructions tied to the affected flow and requirement. Do not make vague requests such as “fix the UI.”
7. After the Developer's fix, re-check the affected flow and report whether the evidence now supports the acceptance criterion. Record unverified flows as unverified.

## Coordination workflow

The two roles coordinate through explicit written handoffs in the task conversation or agent environment. They must not claim direct agent-to-agent communication unless the environment actually provides it.

1. **Scope:** Orchestrator identifies the user goal and relevant acceptance criteria from product docs. Ask the user only when a genuine requirement conflict or missing decision blocks safe implementation.
2. **Inspect:** Developer inspects repo and documents, then shares a brief plan. Reviewer may independently note risk areas without editing.
3. **Build:** Developer implements one coherent slice and reports files, checks, and known limits.
4. **Review:** Reviewer independently checks the diff and runs browser/computer-use review if available. Reviewer sends evidence-backed findings and precise repair instructions to Developer.
5. **Fix:** Developer addresses confirmed in-scope findings one at a time, reports the change, and runs requested relevant checks.
6. **Re-review:** Reviewer rechecks the changed paths and closes each issue as fixed with evidence, unresolved, or not reproducible. Continue the loop for remaining in-scope confirmed defects.
7. **Finish:** Orchestrator reports implemented scope, criteria supported by evidence, exact checks and browser flows completed, unresolved defects, and limitations. Do not claim “project complete” unless the agreed project scope and criteria have actually been covered.

### Concurrency and file ownership

Only one agent edits a given file at a time. The Reviewer starts read-only; it sends a repair brief before any code edit. If a fix is assigned to the Reviewer, Developer pauses edits to overlapping files and reviews the resulting patch afterward. Keep handoffs concise and include paths, expected behavior, observed behavior, and validation evidence.

## Required final report

- Implemented or reviewed scope.
- Product acceptance criteria addressed, with evidence.
- Checks and browser flows actually run, with outcomes.
- Confirmed issues fixed and unresolved issues.
- Missing documents, environment limitations, or unverified behavior.
