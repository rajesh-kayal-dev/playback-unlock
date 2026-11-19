import { useRef, useState, type CSSProperties } from "react";
import { FastForwardIcon } from "@phosphor-icons/react/FastForward";
import { RewindIcon } from "@phosphor-icons/react/Rewind";
import type { Command, VideoSummary } from "../shared/messages";

export function formatTime(time: number | null, tenths = false) {
  if (time === null) return "—";
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor(time / 60) % 60;
  const whole = String(Math.floor(time % 60)).padStart(2, "0");
  const fraction = tenths ? "." + Math.floor(time * 10) % 10 : "";
  return `${hours ? hours + ":" + String(minutes).padStart(2, "0") : minutes}:${whole}${fraction}`;
}

export default function Timeline({ video, busy, interval, send }: {
  video: VideoSummary; busy: boolean; interval: number; send: (command: Command) => void;
}) {
  const [draft, setDraft] = useState<number>();
  const dragging = useRef(false);
  const seek = (time: number) => send({ type: "SEEK_TO", payload: { videoId: video.id, time } });
  const jump = (seconds: number) => send({ type: "SEEK_BY", payload: { videoId: video.id, seconds } });
  const unavailable = !video.availableControls.seek;
  const position = draft ?? video.currentTime;
  const duration = video.duration ?? 0;
  const progress = duration > 0 ? Math.max(0, Math.min(100, (position / duration) * 100)) : 0;
  return (
    <section className="popup-section timeline-section" aria-label="Timeline and seeking">
      <div className="section-heading">
        <div className="time"><strong>{formatTime(position)}</strong><span> / {formatTime(video.duration)}</span></div>
        <div className="button-row">
          <button className="seek-button" type="button" aria-label={`Back ${interval} seconds`} disabled={unavailable}
            aria-disabled={busy || undefined} onClick={() => { if (!busy) jump(-interval); }}>
            <RewindIcon size={14} aria-hidden="true" /> <span>{interval}s</span>
          </button>
          <button className="seek-button" type="button" aria-label={`Forward ${interval} seconds`} disabled={unavailable}
            aria-disabled={busy || undefined} onClick={() => { if (!busy) jump(interval); }}>
            <span>{interval}s</span> <FastForwardIcon size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
      {duration > 0 && (
        <div className="timeline-progress" style={{ "--progress": `${progress}%` } as CSSProperties}>
          <input className="timeline" type="range" aria-label="Video timeline" min={0} max={duration}
          step={0.01} value={position}
          aria-valuetext={`${formatTime(position)} of ${formatTime(duration)}`} disabled={unavailable}
          aria-disabled={busy || undefined}
          onPointerDown={(event) => {
            if (busy) {
              event.preventDefault();
              return;
            }
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerCancel={() => { dragging.current = false; setDraft(undefined); }}
          onPointerUp={(event) => {
            if (dragging.current && !busy) seek(event.currentTarget.valueAsNumber);
            dragging.current = false;
            setDraft(undefined);
          }}
          onChange={(event) => {
            if (busy) return;
            if (dragging.current) setDraft(event.currentTarget.valueAsNumber);
            else seek(event.currentTarget.valueAsNumber);
          }} />
        </div>
      )}
      {unavailable && <p className="hint">The player does not expose a seekable range yet.</p>}
      {!unavailable && duration <= 0 && <p className="hint">The timeline requires a known duration.</p>}
    </section>
  );
}
