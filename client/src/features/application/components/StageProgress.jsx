import { PIPELINE_STAGES, stageIndex, isClosedOut } from "../applicationConstants";

/**
 * Where this application sits in the pipeline.
 *
 * Rejected and withdrawn applications still show the track, up to the last
 * stage actually reached — "you got to interview and then it ended" is more
 * useful and less bleak than replacing everything with a single grey badge.
 */
export default function StageProgress({ status, timeline = [] }) {
  const closedOut = isClosedOut(status);

  // For a closed-out application, find how far they actually got
  const reached = closedOut
    ? Math.max(0, ...timeline.map((e) => stageIndex(e.status)).filter((i) => i >= 0))
    : stageIndex(status);

  return (
    <div>
      <div className="flex items-center gap-1">
        {PIPELINE_STAGES.map((stage, i) => {
          const done = i <= reached;
          return (
            <div key={stage.value} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  done ? (closedOut ? "bg-muted/40" : "bg-accent") : "bg-line"
                }`}
              />
              <p
                className={`mt-1.5 text-[11.5px] ${
                  done && !closedOut ? "text-ink" : "text-muted"
                }`}
              >
                {stage.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}