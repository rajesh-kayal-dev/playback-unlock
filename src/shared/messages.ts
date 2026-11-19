import { SPEED_RANGE_MESSAGE } from "./playback";

export const CHANNEL = "playback-unlock";
export const VERSION = 1;

export interface VideoSummary {
  id: string;
  label: string;
  currentTime: number;
  duration: number | null;
  playbackRate: number;
  paused: boolean;
  ended: boolean;
  seeking: boolean;
  ready: boolean;
  seekableRanges: Array<{ start: number; end: number }>;
  support: "supported" | "partially-supported" | "unsupported";
  availableControls: { speed: boolean; seek: boolean; loop: boolean };
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
  selectedVideoId: string | null;
  loop: LoopState;
  error: ExtensionError | null;
}

const errors = {
  NO_VIDEO: "No supported video found on this page.",
  VIDEO_NOT_FOUND: "That video is no longer available. Select a current video.",
  CONTROL_UNAVAILABLE: "That control is unavailable for this video.",
  INVALID_PAYLOAD: "The request was invalid. Reopen Playback Unlock and try again.",
  INVALID_SPEED: SPEED_RANGE_MESSAGE,
  INVALID_SEEK: "That position is outside the available seek range.",
  INVALID_LOOP: "Set A before B. Both points must be in the same seekable range.",
  TAB_UNAVAILABLE: "There is no active page to control.",
  CONTENT_SCRIPT_UNAVAILABLE: "The page did not respond. Reopen Playback Unlock and try again.",
  PERMISSION_REQUIRED: "Open Playback Unlock from the toolbar on a regular web page to grant access. Chrome pages and restricted sites do not allow it.",
  COMMAND_FAILED: "The video did not apply that change.",
  SPEED_CHANGED: "The player changed the playback speed. The value shown is the current speed.",
  SHORTCUT_CONFLICT: "The page handled that shortcut first. Choose a different binding in Settings.",
} as const;

export type ErrorCode = keyof typeof errors;
export interface ExtensionError {
  code: ErrorCode;
  message: string;
  recoverable: boolean;
}

type PlaybackPayloads = {
  GET_STATE: Record<string, never>;
  SELECT_VIDEO: { videoId: string };
  SET_SPEED: { videoId: string; playbackRate: number };
  ADJUST_SPEED: { videoId: string; delta: number };
  RESET_SPEED: { videoId: string };
  SEEK_BY: { videoId: string; seconds: number };
  SEEK_TO: { videoId: string; time: number };
  SET_LOOP_A: { videoId: string };
  SET_LOOP_B: { videoId: string };
  TOGGLE_LOOP: { videoId: string; enabled?: boolean };
  CLEAR_LOOP: { videoId: string };
};

interface Envelope {
  channel: typeof CHANNEL;
  version: typeof VERSION;
  requestId: string;
}

export type Command = {
  [Type in keyof PlaybackPayloads]: { type: Type; payload: PlaybackPayloads[Type] }
}[keyof PlaybackPayloads];
export type Request = Envelope & Command;

export type Response<T = TabPlaybackState> = Envelope & (
  | { ok: true; data: T }
  | { ok: false; error: ExtensionError }
);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isEnvelope(value: unknown): value is Envelope & Record<string, unknown> {
  return isRecord(value) && value.channel === CHANNEL && value.version === VERSION
    && typeof value.requestId === "string" && value.requestId.trim().length > 0;
}

export function isPlaybackRequest(value: unknown): value is Request {
  if (!isEnvelope(value) || !isRecord(value.payload)) return false;
  if (value.type === "GET_STATE") return Object.keys(value.payload).length === 0;
  const { videoId, playbackRate, delta, seconds, time } = value.payload;
  if (typeof videoId !== "string" || !videoId.length) return false;
  switch (value.type) {
    case "SELECT_VIDEO":
    case "RESET_SPEED":
    case "SET_LOOP_A":
    case "SET_LOOP_B":
    case "CLEAR_LOOP":
      return true;
    case "TOGGLE_LOOP":
      return value.payload.enabled === undefined || typeof value.payload.enabled === "boolean";
    case "SET_SPEED":
      return typeof playbackRate === "number" && Number.isFinite(playbackRate);
    case "ADJUST_SPEED":
      return typeof delta === "number" && Number.isFinite(delta) && Math.abs(delta) <= 1;
    case "SEEK_BY":
      return typeof seconds === "number" && Number.isFinite(seconds);
    case "SEEK_TO":
      return typeof time === "number" && Number.isFinite(time);
    default:
      return false;
  }
}

export function success<T>(requestId: string, data: T): Response<T> {
  return { channel: CHANNEL, version: VERSION, requestId, ok: true, data };
}

export function failure(requestId: string, code: ErrorCode): Extract<Response, { ok: false }> {
  return {
    channel: CHANNEL, version: VERSION, requestId, ok: false,
    error: extensionError(code),
  };
}

export function extensionError(code: ErrorCode): ExtensionError {
  return { code, message: errors[code], recoverable: true };
}
