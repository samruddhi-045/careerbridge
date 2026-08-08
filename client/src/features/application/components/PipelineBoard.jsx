import { useState } from "react";
import ApplicantCard from "./ApplicantCard";
import { PIPELINE_STAGES } from "../applicationConstants";

/**
 * Which moves the board allows — mirrors RECRUITER_TRANSITIONS on the server.
 * The client gating is UX (don't highlight a column that would be refused);
 * the server is still the rule.
 */
const ALLOWED = {
  applied: ["screening", "rejected"],
  screening: ["interview", "rejected"],
  interview: ["offer", "rejected"],
  offer: ["hired", "rejected"],
  hired: [],
  rejected: [],
  withdrawn: [],
};

const COLUMNS = [...PIPELINE_STAGES, { value: "rejected", label: "Not selected" }];

export default function PipelineBoard({ applications, onMove, onOpen }) {
  const [dragging, setDragging] = useState(null);
  const [hoverColumn, setHoverColumn] = useState(null);

  const canDropIn = (status) => dragging && ALLOWED[dragging.status]?.includes(status);

  const byStage = COLUMNS.reduce(
    (acc, col) => ({ ...acc, [col.value]: applications.filter((a) => a.status === col.value) }),
    {}
  );

  const handleDrop = (status) => {
    if (dragging && canDropIn(status)) onMove(dragging, status);
    setDragging(null);
    setHoverColumn(null);
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-3">
        {COLUMNS.map((col) => {
          const items = byStage[col.value] || [];
          const droppable = canDropIn(col.value);
          const isHover = hoverColumn === col.value && droppable;

          return (
            <div
              key={col.value}
              onDragOver={(e) => {
                // preventDefault is what actually permits a drop here
                if (droppable) {
                  e.preventDefault();
                  setHoverColumn(col.value);
                }
              }}
              onDragLeave={() => setHoverColumn(null)}
              onDrop={() => handleDrop(col.value)}
              className={`flex w-[260px] shrink-0 flex-col rounded-xl border p-3 transition-colors ${
                isHover
                  ? "border-accent bg-accent-soft"
                  : droppable
                    ? "border-dashed border-accent/40 bg-white/60"
                    : "border-line bg-white/60"
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-[13.5px] font-medium">{col.label}</p>
                <span className="rounded bg-paper px-1.5 py-0.5 text-[12px] text-muted">
                  {items.length}
                </span>
              </div>

              <ul className="flex-1 space-y-2">
                {items.map((app) => (
                  <ApplicantCard
                    key={app.id}
                    application={app}
                    onOpen={onOpen}
                    onDragStart={setDragging}
                    isDragging={dragging?.id === app.id}
                  />
                ))}

                {items.length === 0 && (
                  <li className="rounded-lg border border-dashed border-line py-8 text-center text-[12.5px] text-muted">
                    {droppable ? "Drop here" : "Empty"}
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}