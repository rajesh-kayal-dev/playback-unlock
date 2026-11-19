# Playback Unlock — Product Requirements Document

## 1. Product overview

- **Product name:** Playback Unlock
- **Product type:** Chrome extension
- **Purpose:** Change video speed, seek through videos, repeat selected sections, and save playback preferences on supported websites.

## 2. Product description

Playback Unlock detects video players on the active webpage. Users can change playback speed, seek through a video, repeat a section, and use keyboard shortcuts through the extension popup or an optional floating controller. The extension reports only the players and controls it can detect and operate.

## 3. Problem statement

Video controls vary across websites. Some players offer limited speed options, while common actions can take several steps. Playback Unlock brings these controls together in one interface for supported video players.

## 4. Product goals

- Provide consistent playback controls across supported websites.
- Make speed changes, seeking, and section looping easy to access.
- Let users select the intended video when a page contains multiple videos.
- Keep the popup, floating controller, and video state synchronized.
- Clearly report unsupported videos and unavailable controls.
- Store user preferences locally.

## 5. Out of scope

- Downloading or recording videos.
- Extracting transcripts or generating summaries.
- AI features, user accounts, or cloud sync.
- Guaranteeing compatibility with every website or video player.
- Changing website account, course, or completion data.

## 6. Target users

- People watching lectures, tutorials, and training videos.
- People practising music, exercise, languages, or other activities with videos.
- Users who want consistent, quickly accessible playback controls across websites.

## 7. User needs

- Users can choose their preferred playback speed.
- Users can seek forward or backward by a chosen interval.
- Users can repeat a selected section.
- Users can use keyboard shortcuts without opening the popup.
- Users can select which video to control when a page has multiple videos.
- Users can save preferences and reuse them later.
- Users can see why a control is unavailable.

## 8. Functional requirements

### 8.1 Video detection and selection

- Detect standard HTML video players on the active page.
- Detect videos added or replaced after the page loads.
- Select the active or primary video automatically when possible.
- Let users choose a video when multiple videos are detected.
- Show a clear empty state when no video is detected.
- Update the selection and controls if the selected video is removed or replaced.

### 8.2 Playback speed

- Provide preset speeds and a custom speed input.
- Provide controls to increase or decrease speed by a configurable step.
- Let users reset speed to `1x` with one action.
- Display the selected video's current speed.
- Let users save a default speed and choose whether to apply it automatically.
- Optionally let users save a different speed for each website.
- Clearly report when a site rejects a speed change or resets the speed.

### 8.3 Seeking

- Let users seek forward or backward by a configurable interval.
- Provide a timeline scrubber in the popup or controller when duration is available.
- Display the current time and total duration.
- Attempt seeking only within the player's available seekable range.
- Explain when duration or seeking is unavailable, such as for some live videos.

### 8.4 A–B loop

- Let users set the current time as the start point **A**.
- Let users set the current time as the end point **B**.
- Require **B** to be later than **A**; do not enable an invalid loop and show an error message.
- Repeat the selected section while the loop is active.
- Provide controls to stop, toggle, and clear the loop.
- Display the loop's start and end times and active state.
- Clear or deactivate the previous loop when the video changes.

### 8.5 Timestamp markers

- Let users save the current video time as a marker.
- Allow an optional label for each marker.
- Let users jump to a saved marker.
- Associate markers with the video for which they were created.
- Let users rename or delete markers.

### 8.6 Keyboard shortcuts

- Provide shortcuts to increase, decrease, and reset speed to `1x`.
- Provide shortcuts for seeking, looping, and markers.
- Let users customize shortcuts.
- Do not trigger shortcuts while a text input or editable field has focus.
- Show the shortcut list and current mappings in settings.
- Report conflicts with website shortcuts when detected.

### 8.7 Extension popup

The popup must include:

- The detected video name or a video selection control.
- Current speed, speed controls, and a reset control.
- Seek controls and a timeline when available.
- A–B loop controls and status.
- Markers saved for the video.
- A control to enable or disable the floating controller.
- A way to open settings.
- Clear messages when the video, permission, or a control is unavailable.

### 8.8 Floating controller

- Provide an optional compact controller near the video.
- Let users drag the controller to reposition it.
- Let users hide and show it.
- Keep its state synchronized with the popup and selected video.
- Let users disable it globally or for a specific website.
- Avoid covering essential video controls where possible.

### 8.9 Settings and local storage

- Save default speed, speed step, seek interval, shortcuts, and controller preferences.
- Optionally save different speed and controller settings for each website.
- Store preferences locally using Chrome extension storage.
- Provide an action to restore all settings to their defaults.
- Apply safe defaults when settings are missing or invalid.

### 8.10 Support and status

- Show player support as supported, partially supported, or unsupported.
- Enable only the controls available for the selected player.
- Do not indicate that an action succeeded if it could not be applied.
- Briefly explain why a feature is unavailable.

## 9. User flows

### Controlling a video

1. The user opens a website containing a video.
2. Playback Unlock detects available videos on the page.
3. The user opens the extension popup.
4. If multiple videos are present, the user selects the intended one.
5. The user changes speed, seeks, sets a loop, or jumps to a marker.
6. The popup and floating controller show the latest video state.

### Changing settings

1. The user opens the settings page.
2. The user chooses a default speed, speed step, seek interval, and shortcuts.
3. The user saves the settings.
4. Saved preferences apply to future supported videos.

### Unsupported video

1. The user opens the extension on a webpage.
2. The extension cannot find a supported video or required control.
3. The popup explains which feature is unavailable and reports its status.

## 10. Technical architecture

- **Content script:** Detects videos on the webpage, reads the selected video's state, and applies available playback commands.
- **Popup UI:** Shows video and control state for the active tab and sends user commands.
- **Floating controller:** Provides optional on-page controls and stays synchronized with the popup.
- **Background service worker:** Coordinates extension events, active tabs, messages, and preferences.
- **Storage layer:** Saves preferences and video markers locally.
- **Messaging layer:** Sends validated commands and state updates between the popup, content script, service worker, and floating controller.

## 11. Non-functional requirements

- **Performance:** Video detection and state updates must not noticeably slow down the webpage.
- **Reliability:** Video changes must not leave stale event listeners or controllers behind.
- **Usability:** Controls must remain readable and usable at common browser zoom levels.
- **Privacy:** Preferences stay local; unnecessary browsing or playback data is not collected.
- **Security:** Request only necessary permissions and validate messages between extension components.
- **Maintainability:** Keep video detection, playback commands, UI, and storage in separate modules.
- **Accessibility:** Support keyboard navigation, visible focus states, and accessible control names.

## 12. Errors and edge cases

- No video is detected on the page.
- Multiple videos are detected and selection is required.
- The video is removed or replaced while the popup is open.
- A live video has no fixed duration.
- The requested seek position is outside the available range.
- The website changes or rejects the selected speed.
- The video is paused, buffering, or ended.
- The extension does not have permission to access the page or embedded frame.
- Saved preferences are missing or invalid.
- A video is detected, but one or more controls are unavailable.

## 13. Initial release scope

The first release includes:

- Standard HTML video detection and selection when multiple videos are present.
- Preset and custom speed controls.
- Speed reset and configurable speed step.
- Forward and backward seeking, plus a timeline scrubber when available.
- A–B looping.
- Keyboard shortcuts.
- Extension popup.
- Local preference storage.
- Unsupported states and error messages.

Timestamp markers, additional floating controller options, and per-website rules may be included in a later release.

## 14. Acceptance criteria

- On a supported page, the extension detects the video and displays its current speed.
- Users can change speed and reset it to `1x`; the UI shows the updated value.
- Seek controls work within the range exposed by the player.
- A valid A–B loop repeats the selected section and stops when cleared.
- Shortcuts do not activate while a text input has focus.
- Saved settings remain available after Chrome restarts.
- When a video changes, the previous selection, loop, and controller state are cleared or updated correctly.
- Unsupported pages and unavailable actions show clear messages.
- On pages with multiple videos, users can select the intended video.

## 15. Success measures

- Video detection rate on the selected test pages.
- Success rate for speed, seeking, and A–B looping on tested videos.
- Number of stale or duplicate controllers after a video changes.
- Number of user-reported control failures or unclear messages.
- Reliability of preference storage and keyboard shortcuts.
