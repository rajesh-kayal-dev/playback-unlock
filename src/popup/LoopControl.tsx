import type { Command, LoopState, VideoSummary } from "../shared/messages";
import { formatTime } from "./Timeline";

export default function LoopControl({ video, loop, busy, issue, send }: {
  video: VideoSummary; loop: LoopState; busy: boolean; issue?: string; send: (command: Command) => void;
}) {
  const payload = { videoId: video.id };
  const unavailable = !video.availableControls.loop;
  return (
    <section className="popup-section loop-section" aria-labelledby="loop-heading">
      <div className="section-heading">
        <h2 id="loop-heading">A–B loop</h2>
        <label className="loop-toggle">
          <input className="switch-input" type="checkbox" role="switch" aria-label="Enable A–B loop"
            aria-describedby={issue ? "loop-error" : undefined} checked={loop.enabled} disabled={unavailable}
            aria-disabled={busy || undefined}
            onChange={(event) => {
              if (!busy) send({ type: "TOGGLE_LOOP", payload: { ...payload, enabled: event.target.checked } });
            }} />
          <span className="switch-track" aria-hidden="true" />
          <span className="loop-state" aria-live="polite">{loop.enabled ? "Loop active" : "Enable loop"}</span>
        </label>
      </div>
      <div className="loop-points">
        <div className="loop-point">
          <div className="point-value"><span>A</span><strong>{formatTime(loop.start, true)}</strong></div>
          <button type="button" disabled={unavailable} aria-disabled={busy || undefined}
            onClick={() => { if (!busy) send({ type: "SET_LOOP_A", payload }); }}>Set A</button>
        </div>
        <div className="loop-point">
          <div className="point-value"><span>B</span><strong>{formatTime(loop.end, true)}</strong></div>
          <button type="button" disabled={unavailable} aria-disabled={busy || undefined}
            onClick={() => { if (!busy) send({ type: "SET_LOOP_B", payload }); }}>Set B</button>
        </div>
      </div>
      <div className="loop-help">
        {issue ? <p id="loop-error" className="hint inline-error" role="status">{issue}</p>
          : unavailable ? <p className="hint">Looping requires a seekable range.</p>
          : loop.end === null ? <p className="hint">Set A, then set B at a later time.</p>
          : <p className="hint">{loop.enabled ? "Repeating the selected segment." : "Ready to repeat this segment."}</p>}
        <button className="quiet-button" type="button" disabled={loop.start === null} aria-disabled={busy || undefined}
          onClick={() => { if (!busy) send({ type: "CLEAR_LOOP", payload }); }}>Clear loop</button>
      </div>
    </section>
  );
}
