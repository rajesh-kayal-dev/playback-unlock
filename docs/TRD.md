# Playback Unlock — Technical Requirements Document

## 1. Purpose

Playback Unlock is a Chrome extension that lets a user control video playback on supported web pages. This document defines its initial technical architecture and implementation requirements.

## 2. Technology Stack

| Area | Technology |
|---|---|
| Browser platform | Chrome Extension, Manifest V3 |
| Popup and options UI | React + TypeScript |
| Development and bundling | Vite |
| Extension page styling | CSS |
| Page video interaction | TypeScript content script |
| Background extension events | TypeScript service worker |
| Local settings | `chrome.storage` API |
| Package manager | npm |

No backend is required for the initial version. User settings remain on the device. A server can be considered later if account-based sync or remote features are added.

## 3. Architecture

The extension has three execution areas:

1. **Popup UI** — React interface opened from the Chrome toolbar. It displays the current controls and lets the user change supported playback settings.
2. **Content script** — Runs in supported web pages, finds the page's HTML video element, and applies playback controls. It communicates with the extension through Chrome's messaging APIs.
3. **Service worker** — Handles extension events, message routing, and coordination with storage. It must work within Manifest V3 service-worker lifecycle rules and must not rely on staying active continuously.

An options page may be added for settings that do not fit in the popup. Both popup and options pages can share React components and storage logic.

## 4. Build Requirements

- Vite must produce separate build outputs for the popup, service worker, and content script.
- The build must emit a valid `manifest.json` at the extension package root.
- The manifest must use Manifest V3 and declare only the permissions and host access needed by implemented features.
- The production build must use browser-compatible JavaScript modules and paths supported by Chrome extensions.
- Development must support loading the built extension through `chrome://extensions` with Developer mode enabled.

## 5. Functional Requirements

- The popup must show whether a supported video is available on the active tab.
- The user must be able to invoke the playback controls defined by the product requirements.
- The content script must locate and interact with HTML5 video elements on supported pages.
- The extension must handle pages with no video element without crashing and show a clear unavailable state.
- Settings must be saved and restored using `chrome.storage`.
- Popup-to-content-script commands must use asynchronous message passing and handle missing tabs or unavailable content scripts gracefully.
- The initial release must not require user accounts or send settings to a remote server.

> Exact playback controls and supported-site behavior must follow the approved PRD. This document does not add unspecified features.

## 6. Permissions and Privacy

- Request the minimum Chrome permissions required for the approved features.
- Prefer user-triggered access to the active tab where feasible; use host permissions only when required by the final interaction model.
- Do not collect, transmit, or store browsing history or video content.
- Store only extension settings locally through `chrome.storage`.
- Document any permission in the manifest with the feature that requires it.

## 7. Error Handling

- Handle missing video elements, inaccessible pages, closed tabs, and messaging failures with a safe UI state.
- Avoid uncaught errors when a video is removed or replaced after the page loads.
- Do not repeatedly inject scripts or register duplicate listeners during page navigation or hot reload.
- Log useful development diagnostics without exposing page content or personal data.

## 8. Project Structure

```text
playback-unlock/
├── manifest.json
├── index.html
├── src/
│   ├── popup/
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── content/
│   │   └── index.ts
│   ├── background/
│   │   └── index.ts
│   ├── shared/
│   │   ├── messages.ts
│   │   └── settings.ts
│   └── styles/
│       └── popup.css
├── public/
├── vite.config.ts
├── tsconfig.json
└── package.json
```

The build configuration may adjust filenames or folders as needed, but it must preserve the separate extension entry points and produce a loadable package.

## 9. Development and Verification

- Install dependencies with `npm install`.
- Run the Vite development workflow for UI work.
- Build the extension with the production build command.
- Load the generated extension directory in Chrome.
- Verify popup rendering, storage persistence, content-script messaging, supported video controls, and the no-video/error states on a local test page and supported sites.
- Inspect service-worker and content-script errors using Chrome DevTools.

## 10. Technical Constraints

- Chrome APIs must be accessed through the extension APIs available to the relevant extension context.
- The content script must treat page DOM and page state as dynamic.
- The service worker may be suspended by Chrome, so persistent state must be stored rather than held only in memory.
- Extension UI and page scripts run in different contexts; communicate through message passing instead of assuming shared variables.
- Next.js is not part of the initial stack because the extension has no server-rendered web app or backend requirement.

## 11. Open Decisions

- The precise playback controls and keyboard shortcuts, if any, are defined by the PRD.
- The exact list of supported video sites and required host permissions must be finalized before manifest permissions are set.
- Decide whether an options page is needed after the popup controls are finalized.
