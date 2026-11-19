# Playback Unlock — MVP Scope

## Goal

Deliver a Chrome extension that provides reliable, quick playback controls for standard HTML5 videos on supported webpages.

## MVP user

A person watching a video who wants to adjust playback speed, seek, or repeat a section from one consistent extension interface.

## MVP features

1. **Detect video** — Find standard HTML5 video elements on the active page and indicate whether a controllable video is available.
2. **Select active video** — If a page contains multiple videos, let the user choose which one to control.
3. **Playback speed** — Provide common speed presets, a custom speed input, small increase/decrease controls, and a reset to `1x`.
4. **Seek controls** — Let users jump forward or backward by a configurable interval. Show current time, duration, and a timeline scrubber when the player exposes these values.
5. **A–B loop** — Set start and end points from the current playback position, repeat the selected section, and clear or disable the loop.
6. **Keyboard shortcuts** — Provide shortcuts for speed changes, reset, seeking, and loop controls. Do not trigger them while the user is typing.
7. **Popup UI** — Use a compact React popup to show the selected video, current playback state, and controls.
8. **Local preferences** — Store speed, speed step, seek interval, and shortcut settings using `chrome.storage`.
9. **Status and errors** — Explain when no compatible video is detected or a particular control is unavailable.

## Not in MVP

- Floating on-page controller.
- Timestamp markers and labels.
- User accounts, backend, or cloud synchronization.
- Video downloading, recording, transcript extraction, or summaries.
- Guaranteed support for every website, embedded player, or live stream.
- Site-specific integrations beyond the standard HTML5 video interface.

## Technical stack

- Chrome Extension Manifest V3
- React and TypeScript for the popup
- Vite for development and building
- TypeScript content script for webpage video detection and control
- TypeScript service worker for extension events and coordination
- `chrome.storage` for local preferences
- npm for package management

No backend is required for the MVP.

## Primary user flow

1. The user opens a webpage containing one or more videos.
2. The extension detects available HTML5 video elements.
3. The user opens the popup and selects a video if needed.
4. The user adjusts speed, seeks, or sets an A–B loop.
5. The popup reflects the selected video's current state and reports unavailable controls.

## MVP acceptance criteria

- The extension loads in Chrome as a Manifest V3 unpacked extension.
- The popup reports when no supported video is available.
- On a supported page, the user can select a video and see its current playback speed.
- Speed presets, custom speed, speed step controls, and reset to `1x` update the selected video when supported.
- Seek controls and the timeline work within the range exposed by the player.
- A valid A–B loop repeats its selected segment and can be cleared.
- Keyboard shortcuts work outside text-entry fields.
- Preferences persist after Chrome restarts.
- Missing videos, inaccessible pages, and failed commands result in clear UI states rather than uncaught errors.
- The popup and content script communicate through Chrome extension messaging; settings are stored locally.

## MVP build order

1. Create the Manifest V3 extension shell and Vite build outputs.
2. Build the React popup and no-video state.
3. Add content-script video detection and video selection.
4. Add speed controls and state updates.
5. Add seeking and timeline controls.
6. Add A–B looping.
7. Add keyboard shortcuts and local preferences.
8. Verify the built extension on a local HTML5 video page and selected supported websites.

## MVP boundary

The MVP controls standard HTML5 video elements where the page and browser expose the required controls. Website-specific players and embedded frames may need separate compatibility work and are not assumed to work automatically.
