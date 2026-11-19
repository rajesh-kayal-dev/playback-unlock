# Playback Unlock — Data and Message Schemas

## 1. Purpose

Define the TypeScript data contracts used by Playback Unlock's popup, content script, service worker, and local storage. These schemas cover the MVP only.

## 2. Shared types

```ts
export type VideoId = string;

export type SupportStatus =
  | "supported"
  | "partially-supported"
  | "unsupported";

export type PlaybackCommandName =
  | "GET_STATE"
  | "SELECT_VIDEO"
  | "SET_SPEED"
  | "ADJUST_SPEED"
  | "RESET_SPEED"
  | "SEEK_BY"
  | "SEEK_TO"
  | "SET_LOOP_A"
  | "SET_LOOP_B"
  | "TOGGLE_LOOP"
  | "CLEAR_LOOP";

export type ExtensionErrorCode =
  | "NO_VIDEO"
  | "VIDEO_NOT_FOUND"
  | "CONTROL_UNAVAILABLE"
  | "INVALID_PAYLOAD"
  | "INVALID_SPEED"
  | "INVALID_SEEK"
  | "INVALID_LOOP"
  | "TAB_UNAVAILABLE"
  | "CONTENT_SCRIPT_UNAVAILABLE"
  | "PERMISSION_REQUIRED"
  | "SPEED_CHANGED"
  | "SHORTCUT_CONFLICT"
  | "COMMAND_FAILED";
```

## 3. Video state

```ts
export interface VideoSummary {
  id: VideoId;
  label: string;
  currentTime: number;
  duration: number | null;
  playbackRate: number;
  paused: boolean;
  ended: boolean;
  seeking: boolean;
  ready: boolean;
  seekableRanges: Array<{ start: number; end: number }>;
  support: SupportStatus;
  availableControls: {
    speed: boolean;
    seek: boolean;
    loop: boolean;
  };
}

export interface LoopState {
  enabled: boolean;
  start: number | null;
  end: number | null;
}

export interface TabPlaybackState {
  status: "ready" | "no-video" | "access-required" | "error";
  videos: VideoSummary[];
  embeddedTitle?: string;
  selectedVideoId: VideoId | null;
  loop: LoopState;
  error: ExtensionError | null;
}

export interface ExtensionError {
  code: ExtensionErrorCode;
  message: string;
  recoverable: boolean;
}
```

`duration` is `null` when the media duration is unknown or not finite. `currentTime`, speed, and seek range values are expressed in seconds, except `playbackRate`, which is a multiplier.

`label` is the normalized, length-limited label from the video element's own `aria-label` or `title` attribute when available. It falls back to the video's number. The label stays in the current page session.

## 4. Popup-to-content messages

```ts
export interface ExtensionRequest<T = unknown> {
  channel: "playback-unlock";
  version: 1;
  requestId: string;
  type: PlaybackCommandName;
  payload: T;
}

export interface ExtensionResponse<T = unknown> {
  channel: "playback-unlock";
  version: 1;
  requestId: string;
  ok: boolean;
  data?: T;
  error?: ExtensionError;
}
```

### Payloads

```ts
export type PlaybackCommandPayloads = {
  GET_STATE: Record<string, never>;
  SELECT_VIDEO: { videoId: VideoId };
  SET_SPEED: { videoId: VideoId; playbackRate: number };
  ADJUST_SPEED: { videoId: VideoId; delta: number };
  RESET_SPEED: { videoId: VideoId };
  SEEK_BY: { videoId: VideoId; seconds: number };
  SEEK_TO: { videoId: VideoId; time: number };
  SET_LOOP_A: { videoId: VideoId };
  SET_LOOP_B: { videoId: VideoId };
  TOGGLE_LOOP: { videoId: VideoId; enabled?: boolean };
  CLEAR_LOOP: { videoId: VideoId };
};
```

Each command must validate its payload before operating on a video. The response must echo the matching `requestId`. Unknown message types or invalid payloads return `ok: false` with an `ExtensionError`.

## 5. Local settings schema

Storage key: `playbackUnlock.settings.v1`

```ts
export interface PlaybackUnlockSettingsV1 {
  schemaVersion: 1;
  playback: {
    defaultSpeed: number;
    applyDefaultSpeed: boolean;
    speedStep: number;
    seekIntervalSeconds: number;
  };
  shortcuts: {
    increaseSpeed: string;
    decreaseSpeed: string;
    resetSpeed: string;
    seekForward: string;
    seekBackward: string;
    setLoopStart: string;
    setLoopEnd: string;
    toggleLoop: string;
  };
}
```

Settings must be validated when read from storage. Missing or invalid fields must use application defaults. Do not trust stored values solely because they came from extension storage; validate numeric ranges and shortcut format.

## 6. Defaults and validation

The initial implementation must define these constants in one shared module. The exact speed range is configurable as a product decision and must be consistent across UI validation and content-script validation.

```ts
export const DEFAULT_SETTINGS: PlaybackUnlockSettingsV1 = {
  schemaVersion: 1,
  playback: {
    defaultSpeed: 1,
    applyDefaultSpeed: false,
    speedStep: 0.25,
    seekIntervalSeconds: 5,
  },
  shortcuts: {
    increaseSpeed: "Alt+Shift+ArrowUp",
    decreaseSpeed: "Alt+Shift+ArrowDown",
    resetSpeed: "Alt+Shift+0",
    seekForward: "Alt+Shift+ArrowRight",
    seekBackward: "Alt+Shift+ArrowLeft",
    setLoopStart: "Alt+Shift+[",
    setLoopEnd: "Alt+Shift+]",
    toggleLoop: "Alt+Shift+\\",
  },
};

export const PLAYBACK_LIMITS = {
  minSpeed: 0.25,
  maxSpeed: 10,
  minSpeedStep: 0.05,
  maxSpeedStep: 1,
  minSeekIntervalSeconds: 1,
  maxSeekIntervalSeconds: 120,
} as const;
```

Before implementation, confirm that the chosen shortcut defaults are available and do not conflict with Chrome-reserved commands. If a shortcut cannot be registered by Chrome, report that in settings rather than silently claiming it is active.

## 7. Validation rules

- `requestId` must be a non-empty string generated by the sender.
- `channel` and `version` must match the supported protocol.
- `videoId` must refer to a currently detected video.
- Speeds and deltas must be finite numbers; requested speed must be within configured limits.
- Seek values must be finite. The final target must be clamped to a valid seekable range or rejected with `INVALID_SEEK`.
- A loop end must be later than its start, and both points must be within the selected video's available seekable range.
- The content script must re-check the video and ranges when applying a command, since page state may change after the popup sends it.
- Responses must not include page content or unrelated video metadata.

## 8. Storage behavior

- Store settings under `playbackUnlock.settings.v1` using `chrome.storage.local`.
- Do not store active tab identifiers as durable user preferences.
- Loop state is session state for the current page/video and is not persisted in the MVP.
- A future schema change must use a new version and an explicit migration function.
- Unknown fields may be ignored during reads; required fields must be reconstructed from validated values and defaults.
- The extension settings page sends `SAVE_SETTINGS` with a complete version 1 settings payload. The worker accepts it only from the extension's own settings page, validates it, and echoes the persisted settings in a versioned response.

## 9. Out of scope

The MVP schema does not define cloud sync, accounts, analytics, remote APIs, timestamp markers, or per-site settings. Add schemas for these only when those features are approved in the product requirements.
