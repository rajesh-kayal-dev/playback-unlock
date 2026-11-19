# Security and privacy

Playback Unlock controls HTML5 video in the current tab. It runs locally and makes no network requests.

## Site access

| Permission | What it does |
| --- | --- |
| `activeTab` | Gives the extension temporary access to the current tab when you open it from the toolbar. |
| `scripting` | Lets the service worker inject the packaged playback controller into the top-level page. |
| `storage` | Saves playback preferences and shortcut bindings in the current browser profile. |

The [manifest](../public/manifest.json) declares no host permissions. Browser-internal pages and video players confined to iframes are outside the supported scope. The popup reports when page access is unavailable.

## What stays on your device

Preferences live in `chrome.storage.local`. The selected video and loop points stay in memory for the current page session. When a video element has a label, the popup can display it to help you choose a player. The extension does not store those labels or collect cookies, credentials, or browsing history.

## Playback and message boundaries

The [service worker](../src/background/index.ts) accepts playback commands from the extension popup and settings writes from the extension’s Settings page. It checks the sender and payload before routing a command or writing preferences. The [content script](../src/content/index.ts) validates the request again and checks that the selected video is still available.

Custom speeds must be finite and between 0.25× and 10×. Seeking uses the video’s seekable ranges. A loop requires two usable points with B after A. The popup uses the returned playback state to show what actually applied, since a browser or player can reject a change.

Treat page-provided labels as untrusted text. Keep executable code in the extension package and avoid remote scripts, dynamic evaluation, and HTML injection. Keep the controller focused on playback and leave site access checks and completion records alone.

## Release checks

- Review the built manifest for permission changes and inspect the package for development endpoints or secrets.
- Check that malformed messages, invalid playback values, and removed videos fail safely.
- Confirm preferences stay local and diagnostics omit sensitive page data.
- Review dependency changes and build from the committed lockfile with `npm ci`.

Changes to site access, networking, or data collection require a documented product and privacy review.

## Reporting a security issue

If you find a security issue, contact the maintainer privately if possible. Include the extension version, browser version, and steps to reproduce. Leave out credentials, private video URLs, and other personal data.
