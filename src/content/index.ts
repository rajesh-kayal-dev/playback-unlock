import {
  extensionError, failure, isEnvelope, isPlaybackRequest, success,
  type Command, type ErrorCode, type LoopState, type TabPlaybackState, type VideoSummary,
} from "../shared/messages";
import {
  DEFAULT_SETTINGS, normalizeSettings, readSettings,
  SETTINGS_KEY, shortcutFromEvent, shortcuts, type Shortcut,
} from "../shared/settings";
import { isSpeed, PLAYBACK_LIMITS } from "../shared/playback";

const emptyLoop: LoopState = { enabled: false, start: null, end: null };
const loopEvents = ["timeupdate", "playing", "seeked", "ended", "progress", "durationchange", "emptied"];

function videoLabel(video: HTMLVideoElement, index: number) {
  for (const attribute of ["aria-label", "title"]) {
    const label = video.getAttribute(attribute)?.slice(0, 512).replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, " ")
      .replace(/\s+/g, " ").trim();
    if (label) return Array.from(label).slice(0, 120).join("");
  }
  return `Video ${index + 1}`;
}

function rangesFor(video: HTMLVideoElement): VideoSummary["seekableRanges"] {
  const seekable = video.seekable;
  const duration = Number.isFinite(video.duration) ? video.duration : Infinity;
  const ranges = [];
  for (let index = 0; index < seekable.length; index++) {
    const start = Math.max(0, seekable.start(index));
    const end = Math.min(duration, seekable.end(index));
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) ranges.push({ start, end });
  }
  return ranges;
}

function start() {
  const videos = new Map<HTMLVideoElement, string>();
  const expectedRates = new WeakMap<HTMLVideoElement, number>();
  let selected: HTMLVideoElement | undefined;
  let recent: HTMLVideoElement | undefined;
  let loop = emptyLoop;
  let mediaError: ErrorCode | undefined;
  let settings = DEFAULT_SETTINGS;
  let settingsLoaded = false;
  let shortcutNotice: ErrorCode | undefined;
  const defaultConsidered = new WeakSet<HTMLVideoElement>();

  function useDefaultRate(video: HTMLVideoElement) {
    if (!settingsLoaded || video.readyState < HTMLMediaElement.HAVE_METADATA || defaultConsidered.has(video)) return;
    defaultConsidered.add(video);
    if (video.error || !settings.playback.applyDefaultSpeed || expectedRates.has(video)) return;
    const videoId = videos.get(video);
    if (!videoId) return;
    try {
      const error = apply(video, { type: "SET_SPEED", payload: { videoId, playbackRate: settings.playback.defaultSpeed } });
      if (error && video === selected) mediaError = error;
    } catch {
      if (video === selected) mediaError = "COMMAND_FAILED";
    }
  }

  function onMetadata(event: Event) {
    if (event.isTrusted && event.currentTarget instanceof HTMLVideoElement) useDefaultRate(event.currentTarget);
  }

  function select(video: HTMLVideoElement | undefined) {
    if (video === selected) return;
    selected = video;
    loop = emptyLoop;
    mediaError = undefined;
  }

  function checkLoop(video: HTMLVideoElement): boolean {
    if (loop.start === null) return false;
    const start = loop.start;
    const end = loop.end;
    if (!video.error && rangesFor(video).some((range) => range.start <= start && (end ?? start) <= range.end)) return true;
    loop = emptyLoop;
    mediaError = "INVALID_LOOP";
    return false;
  }

  function enforceLoop(event: Event) {
    if (!event.isTrusted || !(event.currentTarget instanceof HTMLVideoElement)) return;
    const video = event.currentTarget;
    if (event.type === "emptied") {
      expectedRates.delete(video);
      defaultConsidered.delete(video);
      if (video === selected) loop = emptyLoop;
      return;
    }
    if (video !== selected || !video.isConnected || !checkLoop(video)
      || !loop.enabled || loop.start === null || loop.end === null || video.seeking) return;
    if ((video.paused && !video.ended) || (video.currentTime >= loop.start && video.currentTime < loop.end)) return;
    const ended = video.ended;
    const activeLoop = loop;
    try {
      video.currentTime = loop.start;
      if (ended) void video.play().catch(() => {
        if (selected === video && loop === activeLoop) {
          loop = { ...loop, enabled: false };
          mediaError = "COMMAND_FAILED";
        }
      });
    } catch {
      loop = { ...loop, enabled: false };
      mediaError = "COMMAND_FAILED";
    }
  }

  function activity(event: Event) {
    if (event.isTrusted && event.currentTarget instanceof HTMLVideoElement) recent = event.currentTarget;
  }

  function scan() {
    for (const video of videos.keys()) {
      if (video.isConnected && video.ownerDocument === document) continue;
      video.removeEventListener("playing", activity);
      video.removeEventListener("pointerdown", activity);
      video.removeEventListener("loadedmetadata", onMetadata);
      for (const event of loopEvents) video.removeEventListener(event, enforceLoop);
      videos.delete(video);
      if (recent === video) recent = undefined;
      if (selected === video) select(undefined);
    }
    for (const video of document.querySelectorAll("video")) {
      if (!(video instanceof HTMLVideoElement) || videos.has(video)) continue;
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      videos.set(video, Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""));
      video.addEventListener("playing", activity);
      video.addEventListener("pointerdown", activity);
      video.addEventListener("loadedmetadata", onMetadata);
      for (const event of loopEvents) video.addEventListener(event, enforceLoop);
      useDefaultRate(video);
    }
    if (selected) return;
    const candidates = [...videos.keys()];
    const visibleArea = (video: HTMLVideoElement) => {
      const rect = video.getBoundingClientRect();
      const width = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(0, rect.left));
      const height = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(0, rect.top));
      return getComputedStyle(video).visibility === "visible" ? width * height : 0;
    };
    select(candidates.find((video) => !video.paused && !video.ended)
      ?? recent ?? candidates.sort((left, right) => visibleArea(right) - visibleArea(left))[0]);
  }

  const observer = new MutationObserver((records) => {
    if (records.some((record) => [...record.addedNodes, ...record.removedNodes].some((node) =>
      node instanceof Element && (node.localName === "video" || node.querySelector("video"))))) scan();
  });
  observer.observe(document, { childList: true, subtree: true });
  scan();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !(SETTINGS_KEY in changes)) return;
    settings = normalizeSettings(changes[SETTINGS_KEY].newValue);
    if (!settingsLoaded) {
      settingsLoaded = true;
      for (const video of videos.keys()) useDefaultRate(video);
    }
  });
  void readSettings().then((saved) => {
    if (settingsLoaded) return;
    settings = saved;
    settingsLoaded = true;
    for (const video of videos.keys()) useDefaultRate(video);
  }, () => {
    settingsLoaded = true;
  });

  function state(): TabPlaybackState {
    if (selected && loop.start !== null) checkLoop(selected);
    const summaries = Array.from(videos, ([video, id], index): VideoSummary => {
      const seekableRanges = rangesFor(video);
      const seek = seekableRanges.length > 0 && !video.error;
      return {
        id, label: videoLabel(video, index), currentTime: video.currentTime,
        duration: Number.isFinite(video.duration) ? video.duration : null,
        playbackRate: video.playbackRate, paused: video.paused, ended: video.ended, seeking: video.seeking,
        ready: video.readyState >= HTMLMediaElement.HAVE_METADATA, seekableRanges,
        support: video.error ? "unsupported" : seek ? "supported" : "partially-supported",
        availableControls: { speed: !video.error, seek, loop: seek },
      };
    });
    const expectedRate = selected && expectedRates.get(selected);
    return {
      status: summaries.length ? "ready" : "no-video",
      videos: summaries,
      selectedVideoId: selected ? videos.get(selected) ?? null : null,
      loop,
      error: shortcutNotice ? extensionError(shortcutNotice) : mediaError ? extensionError(mediaError)
        : selected && expectedRate !== undefined && selected.playbackRate !== expectedRate
          ? extensionError("SPEED_CHANGED") : null,
    };
  }

  function apply(video: HTMLVideoElement, command: Exclude<Command, { type: "GET_STATE" }>): ErrorCode | undefined {
    if (command.type === "SELECT_VIDEO") {
      select(video);
      return;
    }
    if (command.type === "SET_LOOP_A" || command.type === "SET_LOOP_B"
      || command.type === "TOGGLE_LOOP" || command.type === "CLEAR_LOOP") {
      if (video !== selected) return "VIDEO_NOT_FOUND";
      mediaError = undefined;
      if (command.type === "CLEAR_LOOP") {
        loop = emptyLoop;
        return;
      }
      if (command.type === "TOGGLE_LOOP" && !(command.payload.enabled ?? !loop.enabled)) {
        loop = { ...loop, enabled: false };
        return;
      }
      const ranges = rangesFor(video);
      if (!ranges.length || video.error) return "CONTROL_UNAVAILABLE";
      const time = video.currentTime;
      if (command.type === "SET_LOOP_A") {
        if (!ranges.some(({ start, end }) => start <= time && time < end)) return "INVALID_LOOP";
        loop = { enabled: false, start: time, end: null };
        return;
      }
      const start = loop.start;
      const end = command.type === "SET_LOOP_B" ? time : loop.end;
      if (start === null || end === null || end <= start
        || !ranges.some((range) => range.start <= start && end <= range.end)) return "INVALID_LOOP";
      if (command.type === "SET_LOOP_B") {
        loop = { enabled: loop.enabled, start, end };
        return;
      }
      if (time < start || time >= end) video.currentTime = start;
      loop = { enabled: true, start, end };
      return;
    }
    if (video.error) return "CONTROL_UNAVAILABLE";
    if (command.type === "SEEK_BY" || command.type === "SEEK_TO") {
      const target = command.type === "SEEK_TO" ? command.payload.time : video.currentTime + command.payload.seconds;
      if (!Number.isFinite(target)) return "INVALID_SEEK";
      let nearest: number | undefined;
      for (const { start, end } of rangesFor(video)) {
        const clamped = Math.min(end, Math.max(start, target));
        if (nearest === undefined || Math.abs(clamped - target) < Math.abs(nearest - target)) nearest = clamped;
      }
      if (nearest === undefined) return "CONTROL_UNAVAILABLE";
      video.currentTime = nearest;
      if (Math.abs(video.currentTime - nearest) > 0.05) return "COMMAND_FAILED";
      return;
    }
    const { minSpeed, maxSpeed } = PLAYBACK_LIMITS;
    const rate = command.type === "SET_SPEED" ? command.payload.playbackRate
      : command.type === "RESET_SPEED" ? 1
      : Math.min(maxSpeed, Math.max(minSpeed, Number((video.playbackRate + command.payload.delta).toFixed(4))));
    if (!isSpeed(rate)) return "INVALID_SPEED";
    video.playbackRate = rate;
    if (video.playbackRate !== rate) return "COMMAND_FAILED";
    expectedRates.set(video, rate);
  }

  function shortcutCommand(action: Shortcut, videoId: string): Exclude<Command, { type: "GET_STATE" }> {
    const { speedStep, seekIntervalSeconds } = settings.playback;
    switch (action) {
      case "increaseSpeed": return { type: "ADJUST_SPEED", payload: { videoId, delta: speedStep } };
      case "decreaseSpeed": return { type: "ADJUST_SPEED", payload: { videoId, delta: -speedStep } };
      case "resetSpeed": return { type: "RESET_SPEED", payload: { videoId } };
      case "seekForward": return { type: "SEEK_BY", payload: { videoId, seconds: seekIntervalSeconds } };
      case "seekBackward": return { type: "SEEK_BY", payload: { videoId, seconds: -seekIntervalSeconds } };
      case "setLoopStart": return { type: "SET_LOOP_A", payload: { videoId } };
      case "setLoopEnd": return { type: "SET_LOOP_B", payload: { videoId } };
      case "toggleLoop": return { type: "TOGGLE_LOOP", payload: { videoId } };
    }
  }

  window.addEventListener("keydown", (event) => {
    if (!event.isTrusted || event.repeat || document.designMode === "on"
      || event.composedPath().some((node) => node instanceof HTMLElement
        && (node.isContentEditable || node.matches("input, textarea, select, [role=textbox], [role=combobox]")))) return;
    const binding = shortcutFromEvent(event);
    if (!binding) return;
    const action = shortcuts.find((key) => settings.shortcuts[key] === binding);
    if (!action || !selected || !selected.isConnected) return;
    if (event.defaultPrevented) {
      shortcutNotice = "SHORTCUT_CONFLICT";
      return;
    }
    const videoId = videos.get(selected);
    if (!videoId) return;
    event.preventDefault();
    try {
      shortcutNotice = apply(selected, shortcutCommand(action, videoId));
    } catch {
      shortcutNotice = "COMMAND_FAILED";
    }
  });

  chrome.runtime.onMessage.addListener((message: unknown, sender, reply) => {
    if (sender.id !== chrome.runtime.id || sender.tab || sender.url !== chrome.runtime.getURL("background.js")) return;
    if (!isEnvelope(message)) return;
    if (!isPlaybackRequest(message)) {
      reply(failure(message.requestId, "INVALID_PAYLOAD"));
      return;
    }
    scan();
    if (message.type !== "GET_STATE") {
      const { videoId } = message.payload;
      const video = [...videos].find(([, id]) => id === videoId)?.[0];
      if (!video) {
        reply(failure(message.requestId, "VIDEO_NOT_FOUND"));
        return;
      }
      try {
        shortcutNotice = undefined;
        const error = apply(video, message);
        if (error) {
          reply(failure(message.requestId, error));
          return;
        }
      } catch {
        reply(failure(message.requestId, "COMMAND_FAILED"));
        return;
      }
    }
    reply(success(message.requestId, state()));
  });
}

const scope = globalThis as typeof globalThis & { playbackUnlockStarted?: boolean };
if (!scope.playbackUnlockStarted) {
  scope.playbackUnlockStarted = true;
  start();
}
