import { isRecord } from "./messages";
import { inRange, isSpeed, PLAYBACK_LIMITS } from "./playback";

export const SETTINGS_KEY = "playbackUnlock.settings.v1";

export const shortcutLabels = {
  increaseSpeed: "Increase speed",
  decreaseSpeed: "Decrease speed",
  resetSpeed: "Reset speed",
  seekForward: "Seek forward",
  seekBackward: "Seek backward",
  setLoopStart: "Set loop A",
  setLoopEnd: "Set loop B",
  toggleLoop: "Toggle loop",
} as const;

export type Shortcut = keyof typeof shortcutLabels;
export const shortcuts = Object.keys(shortcutLabels) as Shortcut[];

export interface Settings {
  schemaVersion: 1;
  playback: {
    defaultSpeed: number;
    applyDefaultSpeed: boolean;
    speedStep: number;
    seekIntervalSeconds: number;
  };
  shortcuts: Record<Shortcut, string>;
}

export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: 1,
  playback: { defaultSpeed: 1, applyDefaultSpeed: false, speedStep: 0.25, seekIntervalSeconds: 5 },
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


const modifierOrder = ["Ctrl", "Alt", "Shift", "Meta"];
const supportedKey = /^(?:[A-Z0-9]|Arrow(?:Up|Down|Left|Right)|\[|\]|\\|,|\.|\/|;|'|-|=|`)$/;

function isShortcut(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 40) return false;
  const parts = value.split("+");
  const key = parts.pop() ?? "";
  return supportedKey.test(key) && parts.some((part) => part === "Ctrl" || part === "Alt" || part === "Meta")
    && parts.join("+") === modifierOrder.filter((modifier) => parts.includes(modifier)).join("+");
}

const physicalPunctuation: Record<string, string> = {
  BracketLeft: "[", BracketRight: "]", Backslash: "\\", Comma: ",", Period: ".", Slash: "/",
  Semicolon: ";", Quote: "'", Minus: "-", Equal: "=", Backquote: "`",
};

export function shortcutFromEvent(event: KeyboardEvent): string | undefined {
  if (event.isComposing || event.getModifierState("AltGraph")) return;
  const key = /^Digit[0-9]$/.test(event.code) ? event.code.slice(-1)
    : physicalPunctuation[event.code] ?? (/^[a-z]$/i.test(event.key) ? event.key.toUpperCase() : event.key);
  const modifiers = [event.ctrlKey, event.altKey, event.shiftKey, event.metaKey];
  const value = [...modifierOrder.filter((_, index) => modifiers[index]), key].join("+");
  return isShortcut(value) ? value : undefined;
}

export function duplicateShortcutKeys(values: Record<Shortcut, string>): Shortcut[] {
  return shortcuts.filter((key) => shortcuts.some((other) => other !== key && values[other] === values[key]));
}

export function normalizeSettings(value: unknown): Settings {
  if (!isRecord(value) || value.schemaVersion !== 1) return DEFAULT_SETTINGS;
  const playback = isRecord(value.playback) ? value.playback : {};
  const savedShortcuts = isRecord(value.shortcuts) ? value.shortcuts : {};
  const defaults = DEFAULT_SETTINGS.playback;
  const { minSpeedStep, maxSpeedStep, minSeekIntervalSeconds, maxSeekIntervalSeconds } = PLAYBACK_LIMITS;
  const keys = { ...DEFAULT_SETTINGS.shortcuts };
  for (const key of shortcuts) {
    const binding = savedShortcuts[key];
    if (isShortcut(binding)) keys[key] = binding;
  }
  // A reset to a default can reveal another conflict with a previously valid custom binding.
  for (let duplicates = duplicateShortcutKeys(keys); duplicates.length; duplicates = duplicateShortcutKeys(keys)) {
    for (const key of duplicates) keys[key] = DEFAULT_SETTINGS.shortcuts[key];
  }
  return {
    schemaVersion: 1,
    playback: {
      defaultSpeed: isSpeed(playback.defaultSpeed) ? playback.defaultSpeed : defaults.defaultSpeed,
      applyDefaultSpeed: typeof playback.applyDefaultSpeed === "boolean" ? playback.applyDefaultSpeed : defaults.applyDefaultSpeed,
      speedStep: inRange(playback.speedStep, minSpeedStep, maxSpeedStep) ? playback.speedStep : defaults.speedStep,
      seekIntervalSeconds: inRange(playback.seekIntervalSeconds, minSeekIntervalSeconds, maxSeekIntervalSeconds)
        ? playback.seekIntervalSeconds : defaults.seekIntervalSeconds,
    },
    shortcuts: keys,
  };
}

export function isSettings(value: unknown): value is Settings {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isRecord(value.playback) || !isRecord(value.shortcuts)) return false;
  const normalized = normalizeSettings(value);
  const playback = value.playback;
  const bindings = value.shortcuts;
  return Object.entries(normalized.playback).every(([key, setting]) => playback[key] === setting)
    && shortcuts.every((key) => bindings[key] === normalized.shortcuts[key]);
}

export async function readSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return normalizeSettings(stored[SETTINGS_KEY]);
}
