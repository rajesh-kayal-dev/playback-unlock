import { useEffect, useRef, useState } from "react";
import { FilmStripIcon } from "@phosphor-icons/react/FilmStrip";
import { GearIcon } from "@phosphor-icons/react/Gear";
import { KeyboardIcon } from "@phosphor-icons/react/Keyboard";
import { VideoCameraIcon } from "@phosphor-icons/react/VideoCamera";
import { WarningCircleIcon } from "@phosphor-icons/react/WarningCircle";
import { CHANNEL, VERSION, failure, type Command, type ExtensionError, type Response, type TabPlaybackState } from "../shared/messages";
import SpeedControl from "./SpeedControl";
import Timeline from "./Timeline";
import LoopControl from "./LoopControl";
import { DEFAULT_SETTINGS, normalizeSettings, readSettings, SETTINGS_KEY } from "../shared/settings";
import Brand from "../ui/Brand";
import ShortcutKeys from "../ui/ShortcutKeys";

export default function App() {
  const [state, setState] = useState<TabPlaybackState>();
  const [error, setError] = useState<ExtensionError>();
  const pending = useRef<Promise<void> | undefined>(undefined);
  const commandPending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    let changed = false;
    const onSettingsChanged: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, area) => {
      if (area !== "local" || !(SETTINGS_KEY in changes)) return;
      changed = true;
      setSettings(normalizeSettings(changes[SETTINGS_KEY].newValue));
    };
    chrome.storage.onChanged.addListener(onSettingsChanged);
    void readSettings().then((settings) => { if (!changed) setSettings(settings); }, () => {});
    return () => {
      changed = true;
      chrome.storage.onChanged.removeListener(onSettingsChanged);
    };
  }, []);

  async function exchange(command: Command) {
    const requestId = crypto.randomUUID();
    let response: Response;
    try {
      response = await chrome.runtime.sendMessage({ channel: CHANNEL, version: VERSION, requestId, ...command });
      if (response?.requestId !== requestId) throw new Error("Unmatched response");
    } catch {
      response = failure(requestId, "CONTENT_SCRIPT_UNAVAILABLE");
    }
    if (response.ok) {
      setState(response.data);
      if (command.type === "GET_STATE") {
        setError((current) => current && ["PERMISSION_REQUIRED", "CONTENT_SCRIPT_UNAVAILABLE", "TAB_UNAVAILABLE"].includes(current.code)
          ? undefined : current);
      }
    } else {
      setError(response.error);
      if (command.type === "GET_STATE") setState(undefined);
      if (response.error.code === "VIDEO_NOT_FOUND") await exchange({ type: "GET_STATE", payload: {} });
    }
  }

  function send(command: Command) {
    const previous = pending.current;
    const isRefresh = command.type === "GET_STATE";
    if (isRefresh && previous) return;
    if (!isRefresh) {
      if (commandPending.current) return;
      commandPending.current = true;
      setBusy(true);
      setError(undefined);
    }
    const operation = Promise.resolve(previous).then(() => exchange(command)).finally(() => {
      if (pending.current === operation) {
        pending.current = undefined;
        commandPending.current = false;
        setBusy(false);
      }
    });
    pending.current = operation;
  }

  useEffect(() => {
    const refresh = () => void send({ type: "GET_STATE", payload: {} });
    refresh();
    const timer = window.setInterval(refresh, 750);
    return () => window.clearInterval(timer);
  }, []);

  const video = state?.videos.find(({ id }) => id === state.selectedVideoId);
  const count = state?.videos.length ?? 0;
  const issue = error ?? state?.error;
  const loopIssue = issue?.code === "INVALID_LOOP" ? issue.message : undefined;
  const noVideo = state?.status === "no-video";
  const embeddedTitle = state?.embeddedTitle;
  const hasAccessError = error?.code === "PERMISSION_REQUIRED";
  const status = !state && error
    ? hasAccessError ? "Access needed" : "Unavailable"
    : video?.support === "unsupported" ? "Unavailable" : video ? "Ready"
      : embeddedTitle ? "Embedded" : noVideo ? "No video" : "Checking…";
  const videoStatus = video?.support === "unsupported" ? "Could not load"
    : video?.ended ? "Ended" : !video?.ready ? "Loading video" : video.paused ? "Paused" : "Playing";

  return (
    <main className="popup">
      <header className="popup-header">
        <Brand />
        <div className="header-actions">
          <span className={`status${status === "Ready" ? " status-ready" : ""}`}>{status}</span>
          <button className="settings-link icon-button" type="button" aria-label="Settings" title="Settings"
            onClick={() => void chrome.runtime.openOptionsPage().catch(() => setError(failure("", "COMMAND_FAILED").error))}>
            <GearIcon size={18} aria-hidden="true" />
          </button>
        </div>
      </header>
      {!video && (
        <div className="empty-state">
          <div className="state-icon" aria-hidden="true">
            {error && !noVideo ? <WarningCircleIcon size={23} /> : <VideoCameraIcon size={23} />}
          </div>
          <h2>{embeddedTitle ?? (noVideo ? "No video detected" : error ? status : "Checking this page")}</h2>
          <p role="status">{error?.message ?? (noVideo
            ? embeddedTitle
              ? "Use the course player for this embedded lecture. If it shows a key-system error, check your browser’s protected-content support."
              : "No supported video found on this page."
            : "Looking for a video you can control.")}</p>
          {(noVideo || (error && !hasAccessError)) && (
            <button type="button" onClick={() => send({ type: "GET_STATE", payload: {} })}>Check again</button>
          )}
        </div>
      )}
      {video && (
        <section className="video-source" aria-label="Selected video">
          <span className="source-icon" aria-hidden="true"><FilmStripIcon size={22} /></span>
          <div className="source-details">
            {count > 1 ? (
              <select aria-label="Select video" aria-disabled={busy || undefined} title={video.label} value={video.id}
                onChange={(event) => send({ type: "SELECT_VIDEO", payload: { videoId: event.target.value } })}>
                {state?.videos.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}
              </select>
            ) : <strong className="source-title" title={video.label}>{video.label}</strong>}
            <small>{count > 1 && `${count} available · `}{videoStatus}</small>
          </div>
        </section>
      )}
      {video && issue && !loopIssue && <p className="popup-notice inline-error" role="status">
        <WarningCircleIcon size={16} aria-hidden="true" /><span>{issue.message}</span>
      </p>}
      {video && <SpeedControl key={`speed-${video.id}`} video={video} busy={busy} step={settings.playback.speedStep} send={send} />}
      {video && <Timeline key={`seek-${video.id}`} video={video} busy={busy} interval={settings.playback.seekIntervalSeconds} send={send} />}
      {video && state && <LoopControl video={video} loop={state.loop} busy={busy} issue={loopIssue} send={send} />}
      {video && <footer className="popup-footer">
        <div><small>Speed up</small> <ShortcutKeys binding={settings.shortcuts.increaseSpeed} /></div>
        <a href="settings.html#shortcuts" target="_blank" rel="noreferrer">
          <KeyboardIcon size={16} aria-hidden="true" /> Shortcuts
        </a>
      </footer>}
    </main>
  );
}
