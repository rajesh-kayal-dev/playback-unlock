<p align="center">
  <img src="public/icons/icon-128.png" width="96" height="96" alt="Playback Unlock logo">
</p>

# Playback Unlock

Control the speed, position, and repeat range of HTML5 videos from a Chrome or Brave toolbar popup. Slow down a demonstration, skim a long lecture, or repeat a phrase without dragging the timeline back each time.

**Manifest V3 · React · TypeScript · Local preferences**

## Contents

- [Features](#features)
- [Installation](#installation)
- [Using the extension](#using-the-extension)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Compatibility and troubleshooting](#compatibility-and-troubleshooting)
- [Privacy and permissions](#privacy-and-permissions)
- [Project structure](#project-structure)
- [Development](#development)
- [Author and license](#author-and-license)

## Features

| Feature | What you can do |
| --- | --- |
| Playback speed | Pick a preset up to 4×, enter a custom rate from 0.25× to 10×, or reset to 1×. |
| Seeking | Scrub the timeline or jump backward and forward by a configurable interval. |
| A–B loop | Repeat a specific section of a seekable video. |
| Video selection | Choose which video to control when multiple videos are detected. |
| Keyboard shortcuts | Adjust playback from the video tab and customize bindings in Settings. |
| Local preferences | Save your default speed, speed step, seek interval, and shortcut bindings in the browser profile. |

## Installation

Use a local copy of this project, Node.js 22.12 or newer, npm, and a desktop installation of Chrome or Brave.

1. In the project directory, install dependencies and build the extension.

   ```sh
   npm ci
   npm run build
   ```

2. Open `chrome://extensions` in Chrome or `brave://extensions` in Brave.
3. Enable **Developer mode** and click **Load unpacked**.
4. Select the generated **`dist/`** folder inside the project.
5. Pin **Playback Unlock** from the browser’s Extensions menu for quick access.

## Using the extension

1. Open a page with an HTML5 video and click the toolbar icon. Select a video from the popup if the page has more than one.
2. Click a speed preset or type a custom rate, such as `1.8` or `3`, and choose **Apply**. Use the timeline or jump buttons to move to another position.
3. To repeat a section, move to its start and choose **Set A**. Move to the end, choose **Set B**, and turn on the loop. B must be after A. Use **Clear loop** to remove both points.
4. Select the gear icon to change your preferences. Enable automatic default speed if you want the selected default applied to videos, then save your changes.

## Keyboard shortcuts

Open the popup once on the video page to activate the shortcuts there. Return focus to the page before using them. The extension skips shortcuts while you type in editable fields.

| Action | Default binding |
| --- | --- |
| Increase / decrease speed | `Alt+Shift+↑` / `Alt+Shift+↓` |
| Reset speed | `Alt+Shift+0` |
| Seek backward / forward | `Alt+Shift+←` / `Alt+Shift+→` |
| Set loop start / end | `Alt+Shift+[` / `Alt+Shift+]` |
| Toggle A–B loop | `Alt+Shift+\` |

## Compatibility and troubleshooting

| What you see | What to try |
| --- | --- |
| No video detected | Start the video and select **Check again**. The extension detects standard HTML5 video elements in the top-level page. |
| Access needed | Try a regular web page. Browser-internal pages and videos inside embedded iframes are outside the extension’s access scope. |
| Speed changes or resets unexpectedly | Some sites override playback rates. The player and browser determine which rates are effective and whether audio plays at high speeds. |
| Seeking or looping is unavailable | Try a seekable video with a finite duration. Live streams can limit available seek positions. |
| Shortcut does nothing | Reopen the popup after navigation, return focus to the page, and use Settings to change bindings that conflict with your browser or OS. |

## Privacy and permissions

Playback Unlock runs locally. The extension makes no network requests and stores only playback preferences and shortcut bindings in the browser profile. The selected video and loop points are session state.

| Permission | Purpose |
| --- | --- |
| `activeTab` | Grant temporary access to the current tab when you open the popup. |
| `scripting` | Inject the playback controller into the current tab’s top frame. |
| `storage` | Save preferences with `chrome.storage.local`. |

See the [security and privacy notes](docs/security.md).

## Project structure

| Path | Responsibility |
| --- | --- |
| `src/popup/` | Toolbar popup and playback controls |
| `src/settings/` | Preferences and shortcut editing |
| `src/background/` | Manifest V3 service worker for message routing and script injection |
| `src/content/` | Video discovery, playback commands, looping, and page shortcuts |
| `src/shared/` | Message contracts, validation, playback limits, and settings |
| `src/ui/` and `src/styles/` | Shared UI components and styles |
| `public/` | Extension manifest and packaged brand icons |
| `docs/` | Product specifications, technical notes, and original design references |
| `dist/` | Generated unpacked extension, rebuilt locally and ignored by Git |

The popup sends commands to the service worker, which routes them to the content script. The content script is the component that reads and changes the page’s video elements and returns the effective playback state. Settings are managed separately through local storage.

| Documentation | What it covers |
| --- | --- |
| [Product requirements](docs/PRD.md) and [MVP scope](docs/MVP.md) | User needs, scope, and acceptance criteria |
| [Technical requirements](docs/TRD.md) and [system design](docs/system-design.md) | Runtime components, execution flow, and failure handling |
| [Schema](docs/schema.md) | Messages, errors, and stored settings |
| [UI/UX spec](docs/UI-UX.md) and [design reference](docs/design/UIUX.png) | Interaction and visual guidelines |

## Development

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the locked dependencies. |
| `npm run typecheck` | Check TypeScript without producing output. |
| `npm run build` | Type-check and build the extension into `dist/`. |

Vite builds the popup, settings page, and service worker first, then emits the content script as a standalone bundle. After changes, rebuild, click **Reload** on the extension card, and refresh the video tab before checking content-script behavior.

For a quick smoke check, verify video detection, a speed preset and a custom rate, a timeline jump, an A–B loop, and a preference that survives reopening Settings.

## Author and license

Created by **Rajesh**. [GitHub profile](https://github.com/rajesh-kayal-dev) · [Project repository](https://github.com/rajesh-kayal-dev/playback-unlock)

Released under the [MIT License](LICENSE).
