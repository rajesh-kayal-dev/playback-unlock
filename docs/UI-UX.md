# Playback Unlock — UI/UX Specification

## 1. Product experience

Playback Unlock is a compact browser utility for controlling the video the user is currently watching. The interface should feel precise, quiet, and dependable. It should prioritize playback controls over decoration and avoid the look of a generic dashboard.

## 2. Design principles

- Put the current playback controls first; keep settings secondary.
- Use a compact, scan-friendly layout suited to a Chrome popup.
- Use plain labels and familiar browser control patterns.
- Use color to indicate focus, selection, and active states, not as decoration.
- Prefer separators and spacing over nested cards.
- Keep controls synchronized with the selected video and show unavailable actions clearly.
- Support keyboard use, visible focus, readable contrast, and accessible names.

## 3. Visual direction

### Theme

The default theme is light, neutral, and low contrast in the background, with clear dark text and a restrained cobalt accent.

| Token | Suggested value | Use |
|---|---|---|
| App background | `#F7F7F5` | Popup and settings surface |
| Primary surface | `#FFFFFF` | Main controls and settings rows |
| Primary text | `#17191D` | Headings, values, labels |
| Secondary text | `#666B73` | Supporting text and metadata |
| Divider | `#E2E4E8` | Section boundaries |
| Accent | `#315FEA` | Focus, selected preset, active slider |
| Success | `#27834A` | Connected/ready indicator |
| Error | `#B42318` | Action or permission errors |
| Disabled | `#A2A6AE` | Unavailable controls |

Use the platform system font stack. Avoid gradients, glows, glass effects, decorative illustrations, oversized shadows, and excessive rounded cards. Use modest corner radii and a consistent spacing scale based on 4 px increments.

## 4. Information architecture

- **Playback popup:** video selection, speed, timeline and seek, A–B loop, shortcut hint.
- **Settings page:** Playback, Shortcuts, About.
- **About:** product version, privacy summary, and support information if available.

The popup should remain focused on the current video. Advanced preferences belong in the settings page.

## 5. Popup layout

Target width: approximately **360 px**, with a height that fits the available popup viewport and scrolls only when necessary.

### Header

- Small Playback Unlock mark and product name.
- Compact status indicator: `Ready`, `No video`, `Access needed`, or `Unavailable`.
- Settings icon with accessible label.
- Do not show a large brand banner or promotional tagline.

### Selected video row

- Show the selected video's title, truncated to one or two lines.
- Show duration or current playback status when available.
- If multiple videos are detected, make the row an explicit selector and expose the number of available videos.
- Avoid fetching or displaying unrelated page text or thumbnails by default.

### Playback speed

- This is the primary control section.
- Show a large, editable current speed value with decrease, increase, and reset controls.
- Provide a compact row of speed presets; visually mark the active preset.
- Make the custom value editable by keyboard and validate it before applying.
- Keep the control understandable without icons alone; provide accessible labels.

### Timeline and seeking

- Show current time and total duration above or beside the timeline.
- Use a thin, high-contrast seek track with a clear thumb and visible focus state.
- Provide compact backward/forward seek buttons with the configured interval in their labels.
- Disable or explain timeline controls when seeking is unavailable or duration is unknown.

### A–B loop

- Present as a secondary utility section, separated by a divider.
- Show an enable toggle and a short label, `A–B loop`.
- Display A and B times in a clear, compact format.
- Provide `Set A` and `Set B` actions.
- Explain invalid or incomplete loop points inline; do not silently enable an invalid loop.
- When the loop is active, use the accent color and a concise active status.

### Shortcut hint

- Show only the most useful shortcuts in a quiet footer.
- Link to the Shortcuts settings section for the complete mapping.
- Do not let shortcut hints compete visually with playback controls.

## 6. Settings page layout

Use a simple preferences layout with a narrow navigation column and a readable content area. Avoid dashboard cards and decorative charts.

### Playback settings

- Default playback speed and whether to apply it to new videos.
- Speed adjustment step.
- Seek interval.
- Settings should use labeled rows with the control aligned consistently on the right.

### Shortcut settings

- List each action and its current key combination.
- Let users change a shortcut through a clear capture interaction.
- Show invalid or conflicting shortcuts next to the affected row.
- Include a restore-defaults action.

### Privacy note

Show a short, factual note: preferences are stored locally in this browser. Do not make claims about data handling that the implementation does not satisfy.

## 7. Interaction behavior

- Opening the popup requests current state for the active tab and selected video.
- User commands show immediate state feedback, then reconcile with the actual media state returned by the content script.
- Do not show success optimistically when the player rejects or cannot perform an operation.
- Keep the selected video consistent across speed, seek, and loop actions.
- Do not apply settings to another tab or video after the active tab changes.
- Close or preserve popup state according to Chrome's normal popup lifecycle; always re-fetch authoritative playback state when reopened.
- Use native form controls where they provide accessible keyboard behavior; style them consistently.

## 8. UI states

### Ready

A supported video is selected. Show active playback controls and current state.

### No video

Show a short message such as `No supported video found on this page.` Keep settings accessible, but disable playback controls.

### Multiple videos

Show a selector with concise video labels and allow explicit selection. Do not silently switch the target during an action.

### Access needed

Explain that the extension needs access to the current page to control its video and provide the browser-supported action to grant access.

### Partially supported

Keep supported controls available. Disable unavailable controls individually and explain why when the user focuses or activates them.

### Loading or stale state

Use a small progress indicator or neutral loading label. If the video changes or disappears, refresh state and show an explanatory message rather than stale values.

### Error

Show a concise, actionable message. Keep technical details out of the main interface; development diagnostics belong in the console.

## 9. Component inventory

- `PopupHeader`
- `ConnectionStatus`
- `VideoSelector`
- `SpeedControl`
- `SpeedPresets`
- `TimelineControl`
- `SeekButtons`
- `LoopControl`
- `ShortcutHint`
- `SettingsNavigation`
- `PlaybackSettingsForm`
- `ShortcutSettingsList`
- `InlineStatusMessage`

Components should receive typed state and command callbacks. They should not query page DOM directly.

## 10. Responsive and sizing behavior

- Design for Chrome's narrow popup first; do not assume a full browser viewport.
- Keep primary controls above the fold where practical.
- Allow the popup content to scroll vertically if needed; avoid horizontal scrolling.
- The settings page can use a wider layout but must remain usable at narrow window widths by stacking navigation above content.
- Truncate long video titles and preserve a way to inspect the full title through accessible text or a tooltip.

## 11. Accessibility requirements

- All controls must be reachable and operable by keyboard.
- Show a visible focus indicator that is distinct from selection state.
- Use labels for icon-only buttons and toggles.
- Do not rely on color alone for active, error, or disabled states.
- Maintain readable text and control contrast.
- Respect reduced-motion preferences; transitions should be brief and nonessential.
- Announce important state changes, such as loop enabled or speed changed, to assistive technology.

## 12. UX acceptance criteria

- A user can identify the selected video and current speed at a glance.
- Speed adjustment is the most prominent action without overwhelming the popup.
- Seeking and looping are discoverable and clearly labeled.
- Unsupported or unavailable controls have an understandable state and reason.
- The interface does not contain decorative dashboard elements, gradients, or misleading success indicators.
- Keyboard focus order follows the visual order and shortcuts do not interfere with text entry.
- The popup remains usable at its target width and settings remain usable on a narrow window.
