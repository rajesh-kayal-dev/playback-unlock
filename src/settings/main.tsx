import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { CheckCircleIcon } from "@phosphor-icons/react/CheckCircle";
import { InfoIcon } from "@phosphor-icons/react/Info";
import { KeyboardIcon } from "@phosphor-icons/react/Keyboard";
import { PlayIcon } from "@phosphor-icons/react/Play";
import { ShieldCheckIcon } from "@phosphor-icons/react/ShieldCheck";
import { CHANNEL, VERSION, type Response } from "../shared/messages";
import {
  DEFAULT_SETTINGS, duplicateShortcutKeys, readSettings,
  shortcutFromEvent, shortcutLabels, shortcuts, type Settings, type Shortcut,
} from "../shared/settings";
import { PLAYBACK_LIMITS } from "../shared/playback";
import Brand from "../ui/Brand";
import ShortcutKeys from "../ui/ShortcutKeys";
import "../styles/base.css";
import "../styles/settings.css";

const fields = [
  { key: "defaultSpeed", label: "Default speed (×)", unit: "×", description: "Speed to use when automatic playback speed is enabled.", min: PLAYBACK_LIMITS.minSpeed, max: PLAYBACK_LIMITS.maxSpeed },
  { key: "speedStep", label: "Speed adjustment step", unit: "×", description: "Amount added or removed by the speed buttons and shortcuts.", min: PLAYBACK_LIMITS.minSpeedStep, max: PLAYBACK_LIMITS.maxSpeedStep },
  { key: "seekIntervalSeconds", label: "Seek interval (seconds)", unit: "sec", description: "Amount of time the back and forward controls skip.", min: PLAYBACK_LIMITS.minSeekIntervalSeconds, max: PLAYBACK_LIMITS.maxSeekIntervalSeconds },
] as const;

const sections = [
  { id: "playback", label: "Playback", Icon: PlayIcon },
  { id: "shortcuts", label: "Shortcuts", Icon: KeyboardIcon },
  { id: "about", label: "About", Icon: InfoIcon },
] as const;

function activeSection() {
  const hash = location.hash.slice(1);
  return sections.find(({ id }) => id === hash)?.id ?? "playback";
}

function SettingsPage() {
  const [draft, setDraft] = useState<Settings>();
  const [saved, setSaved] = useState<Settings>();
  const [section, setSection] = useState(activeSection);
  const [capture, setCapture] = useState<Shortcut>();
  const [captureError, setCaptureError] = useState<{ key: Shortcut; message: string }>();
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    void readSettings().then((settings) => {
      setDraft(settings);
      setSaved(settings);
    }, () => {
      setDraft(DEFAULT_SETTINGS);
      setSaved(DEFAULT_SETTINGS);
      setSaveError(true);
      setNotice("Could not read saved settings. Defaults are shown.");
    });
  }, []);

  useEffect(() => {
    const update = () => setSection(activeSection());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  const loaded = saved !== undefined;
  useEffect(() => {
    if (loaded && location.hash) document.getElementById(activeSection())?.scrollIntoView();
  }, [loaded]);

  function edit(settings: Settings) {
    setDraft(settings);
    setNotice("");
    setSaveError(false);
  }

  async function save(settings: Settings) {
    setSaving(true);
    setNotice("");
    setCapture(undefined);
    try {
      const requestId = crypto.randomUUID();
      const response: Response<Settings> = await chrome.runtime.sendMessage({
        channel: CHANNEL, version: VERSION, requestId, type: "SAVE_SETTINGS", payload: settings,
      });
      if (!response?.ok || response.requestId !== requestId) throw new Error("Settings were not saved");
      setDraft(response.data);
      setSaved(response.data);
      setCaptureError(undefined);
      setSaveError(false);
      setNotice("Settings saved.");
    } catch {
      setSaveError(true);
      setNotice("Could not save settings. Review the values and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!draft) return <main className="settings"><p className="settings-loading" role="status">Loading settings…</p></main>;
  const duplicates = duplicateShortcutKeys(draft.shortcuts);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  return (
    <main className="settings">
      <header className="settings-header"><Brand settings /></header>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {sections.map(({ id, label, Icon }) => (
            <a key={id} href={`#${id}`} aria-current={section === id ? "location" : undefined}>
              <Icon size={18} aria-hidden="true" />{label}
            </a>
          ))}
        </nav>
        <form onSubmit={(event) => { event.preventDefault(); void save(draft); }}>
          <fieldset disabled={saving}>
            <section className="settings-section" id="playback" aria-labelledby="playback-heading" tabIndex={-1}>
              <h2 id="playback-heading">Playback</h2>
              {fields.map(({ key, label, unit, description, min, max }) => (
                <div className="setting-row" key={key}>
                  <div className="setting-label">
                    <label htmlFor={key}>{label}</label>
                    <p className="hint" id={`${key}-description`}>{description}</p>
                  </div>
                  <div className="number-field">
                    <input id={key} type="number" required min={min} max={max} step="any"
                      aria-describedby={`${key}-description`}
                      value={Number.isFinite(draft.playback[key]) ? draft.playback[key] : ""}
                      onChange={(event) => edit({
                        ...draft, playback: { ...draft.playback, [key]: event.currentTarget.valueAsNumber },
                      })} />
                    <span aria-hidden="true">{unit}</span>
                  </div>
                </div>
              ))}
              <label className="setting-row settings-switch">
                <span className="setting-label">Apply default speed to new videos</span>
                <input className="switch-input" type="checkbox" aria-label="Apply default speed to new videos"
                  checked={draft.playback.applyDefaultSpeed} onChange={(event) => edit({
                  ...draft, playback: { ...draft.playback, applyDefaultSpeed: event.currentTarget.checked },
                })} />
                <span className="switch-track" aria-hidden="true" />
              </label>
            </section>
            <section className="settings-section" id="shortcuts" aria-labelledby="shortcuts-heading" tabIndex={-1}>
              <h2 id="shortcuts-heading">Shortcuts</h2>
              <p className="hint">Open Playback Unlock once on a page to enable its shortcuts. Browser or website shortcuts can take priority.</p>
              <div className="shortcut-list">
              {shortcuts.map((key) => (
                <div className="shortcut-row" key={key}>
                  <div className="setting-row">
                    <span>{shortcutLabels[key]}</span>
                    <button className="shortcut-button" type="button" aria-label={`Change shortcut for ${shortcutLabels[key]}`}
                      aria-describedby={`binding-${key}${duplicates.includes(key) || captureError?.key === key ? ` shortcut-${key}` : ""}`}
                      data-capturing={capture === key || undefined}
                      onBlur={() => setCapture(undefined)}
                      onClick={() => { setCapture(key); setCaptureError(undefined); }}
                      onKeyDown={(event) => {
                        if (capture !== key || event.key === "Tab") return;
                        event.preventDefault();
                        if (event.key === "Escape") {
                          setCapture(undefined);
                          return;
                        }
                        if (["Alt", "Shift", "Control", "Meta"].includes(event.key) || event.repeat) return;
                        const binding = shortcutFromEvent(event.nativeEvent);
                        if (!binding) {
                          setCaptureError({ key, message: "Use Ctrl, Alt, or Meta with a letter, number, arrow, or punctuation key." });
                          return;
                        }
                        edit({ ...draft, shortcuts: { ...draft.shortcuts, [key]: binding } });
                        setCapture(undefined);
                        setCaptureError(undefined);
                      }}>
                      <span id={`binding-${key}`}>
                        {capture === key ? "Press a shortcut…" : <ShortcutKeys binding={draft.shortcuts[key]} />}
                      </span>
                    </button>
                  </div>
                  {(duplicates.includes(key) || captureError?.key === key) && (
                    <p id={`shortcut-${key}`} className="hint error" role="status">
                      {captureError?.key === key ? captureError.message : "This shortcut is assigned to more than one action."}
                    </p>
                  )}
                </div>
              ))}
              </div>
            </section>
            <section className="settings-section" id="about" aria-labelledby="about-heading" tabIndex={-1}>
              <h2 id="about-heading">About</h2>
              <div className="privacy-note">
                <ShieldCheckIcon size={22} aria-hidden="true" />
                <div><strong>Local preferences</strong>
                  <p className="hint">Playback settings and shortcuts are stored locally in this browser.</p>
                </div>
              </div>
              <p className="hint version">Version {chrome.runtime.getManifest().version}</p>
            </section>
            <div className="settings-actions">
              <p className={saveError ? "inline-error" : notice ? "saved-notice" : "hint"} role="status">
                {notice && !saveError && <CheckCircleIcon size={16} aria-hidden="true" />}
                {saving ? "Saving…" : notice || (dirty ? "Unsaved changes" : "")}
              </p>
              <div className="button-row">
                <button className="quiet-button" type="button" onClick={() => void save(DEFAULT_SETTINGS)}>Restore defaults</button>
                <button className="primary" type="submit" disabled={!dirty || duplicates.length > 0 || capture !== undefined}>Save settings</button>
              </div>
            </div>
          </fieldset>
        </form>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<SettingsPage />);
