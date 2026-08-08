import { STATUS_LABELS } from "../../application/applicationConstants";

/**
 * Horizontal funnel. Bars are sized against the FIRST stage, not the largest,
 * so the shape reads as a funnel narrowing left to right — which is the whole
 * point of the chart.
 *
 * Drop-off between stages is shown explicitly. "40 applied, 8 screened" is
 * data; "32 didn't get past applied" is the insight.
 */
export default function FunnelChart({ stages }) {
  const top = stages[0]?.count || 0;
  if (!top) return null;

  return (
    <div className="space-y-3">
      {stages.map((s, i) => {
        const width = Math.max((s.count / top) * 100, s.count ? 3 : 0);
        const prev = stages[i - 1];
        const dropped = prev ? prev.count - s.count : 0;

        return (
          <div key={s.stage}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[14px] font-medium">{STATUS_LABELS[s.stage]}</span>
              <span className="text-[13.5px] text-muted">
                {s.count}
                {i > 0 && prev.count > 0 && (
                  <span className="ml-1.5 text-[12.5px]">
                    ({Math.round((s.count / prev.count) * 100)}%)
                  </span>
                )}
              </span>
            </div>

            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-line/60">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${width}%` }}
              />
            </div>

            {i > 0 && dropped > 0 && (
              <p className="mt-1 text-[12px] text-muted">
                {dropped} didn't move past {STATUS_LABELS[prev.stage].toLowerCase()}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}