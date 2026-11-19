const arrowLabels: Record<string, string> = {
  ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
};

export default function ShortcutKeys({ binding }: { binding: string }) {
  const keys = binding.split("+");
  return (
    <span className="shortcut-keys" role="img" aria-label={keys.map((key) => key.replace(/^Arrow/, "Arrow ")).join(" plus ")}>
      {keys.map((key) => <kbd key={key} aria-hidden="true">{arrowLabels[key] ?? key}</kbd>)}
    </span>
  );
}
