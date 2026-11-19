export default function Brand({ settings = false }: { settings?: boolean }) {
  return (
    <h1 className="brand">
      <img className="brand-mark" src={chrome.runtime.getURL("icons/icon-48.png")} width={32} height={32} alt="" />
      <span>Playback Unlock{settings && <span className="brand-context"> settings</span>}</span>
    </h1>
  );
}
