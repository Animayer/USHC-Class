export type MetricRow = {
  key: string;
  label: string;
  value: number;
  scale: number;
  hint: string;
  tone: "high" | "low" | "neutral";
  display?: string;
};

export function MetricBars({ metrics }: { metrics: MetricRow[] }) {
  return (
    <div className="metric-grid">
      {metrics.map((item) => {
        const width = Math.max(4, Math.min(100, (item.value / item.scale) * 100));
        const shown = item.display ?? String(item.value);
        return (
          <div key={item.key} className={`metric metric-${item.tone}`}>
            <div className="metric-top">
              <span>{item.label}</span>
              <strong>{shown}</strong>
            </div>
            <div
              className="meter"
              role="meter"
              aria-label={item.label}
              aria-valuemin={0}
              aria-valuemax={item.scale}
              aria-valuenow={Math.max(0, item.value)}
              title={item.hint}
            >
              <span style={{ width: `${width}%` }} />
            </div>
            <p>{item.hint}</p>
          </div>
        );
      })}
    </div>
  );
}
