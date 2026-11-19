import { useState } from "react";
import { MinusIcon } from "@phosphor-icons/react/Minus";
import { PlusIcon } from "@phosphor-icons/react/Plus";
import type { Command, VideoSummary } from "../shared/messages";
import { isSpeed, PLAYBACK_LIMITS, SPEED_RANGE_MESSAGE } from "../shared/playback";

const presets = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

export default function SpeedControl({ video, busy, step, send }: {
  video: VideoSummary; busy: boolean; step: number; send: (command: Command) => void;
}) {
  const [draft, setDraft] = useState<string>();
  const [invalid, setInvalid] = useState(false);
  const unavailable = !video.availableControls.speed;
  const range = `${PLAYBACK_LIMITS.minSpeed}×–${PLAYBACK_LIMITS.maxSpeed}×`;
  const setRate = (playbackRate: number) => {
    if (busy) return;
    setDraft(undefined);
    setInvalid(false);
    send({ type: "SET_SPEED", payload: { videoId: video.id, playbackRate } });
  };
  const adjust = (delta: number) => {
    if (busy) return;
    setDraft(undefined);
    setInvalid(false);
    send({ type: "ADJUST_SPEED", payload: { videoId: video.id, delta } });
  };

  return (
    <section className="popup-section speed-section" aria-labelledby="speed-heading">
      <div className="section-heading">
        <h2 id="speed-heading">Playback speed</h2>
        <span className="control-range" id="speed-range">{range}</span>
      </div>
      <output className={draft === undefined ? "sr-only" : "applied-speed"} aria-label="Current speed" aria-live="polite">
        {video.playbackRate}×
      </output>
      <form className="speed-row" onSubmit={(event) => {
        event.preventDefault();
        if (busy || unavailable) return;
        const text = draft?.trim();
        const speed = text === undefined ? video.playbackRate
          : /^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text) ? Number(text.replace(",", ".")) : NaN;
        if (isSpeed(speed)) setRate(speed);
        else setInvalid(true);
      }}>
        <button className="icon-button speed-step" type="button" aria-label="Decrease speed" disabled={unavailable}
          aria-disabled={busy || undefined} onClick={() => adjust(-step)}><MinusIcon size={18} aria-hidden="true" /></button>
        <div className="speed-value" data-invalid={invalid || undefined}>
          <input aria-label="Custom speed" inputMode="decimal" aria-invalid={invalid}
            aria-describedby={invalid ? "speed-error" : "speed-range"} disabled={unavailable}
            value={draft ?? String(video.playbackRate)}
            onChange={(event) => { setDraft(event.target.value); setInvalid(false); }}
            onKeyDown={(event) => {
              if (event.key === "Escape" && draft !== undefined) {
                event.preventDefault();
                event.stopPropagation();
                setDraft(undefined);
                setInvalid(false);
              }
            }} />
          <span aria-hidden="true">×</span>
        </div>
        <button className="icon-button speed-step" type="button" aria-label="Increase speed" disabled={unavailable}
          aria-disabled={busy || undefined} onClick={() => adjust(step)}><PlusIcon size={18} aria-hidden="true" /></button>
        <button className="apply-speed" type="submit" disabled={unavailable} aria-disabled={busy || undefined}>Apply</button>
        <button className="quiet-button" type="button" disabled={unavailable} aria-disabled={busy || undefined} onClick={() => {
          if (busy) return;
          setDraft(undefined);
          setInvalid(false);
          send({ type: "RESET_SPEED", payload: { videoId: video.id } });
        }}>Reset</button>
      </form>
      <div className="presets" role="group" aria-label="Speed presets">
        {presets.map((rate) => (
          <button key={rate} type="button" aria-pressed={video.playbackRate === rate}
            disabled={unavailable} aria-disabled={busy || undefined} onClick={() => setRate(rate)}>{rate}×</button>
        ))}
      </div>
      {invalid && <p id="speed-error" className="inline-error hint" role="status">{SPEED_RANGE_MESSAGE}</p>}
      {!video.availableControls.speed && <p className="hint">Speed is unavailable because the video failed to load.</p>}
    </section>
  );
}
