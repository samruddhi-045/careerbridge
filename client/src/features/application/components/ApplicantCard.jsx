import { relativeTime } from "../../job/jobConstants";

/**
 * One applicant on the board.
 *
 * Draggable via the HTML5 drag-and-drop API rather than a library: the board
 * has one interaction (card → column) and pulling in a dnd library for that
 * costs ~30KB to save maybe forty lines.
 */
export default function ApplicantCard({ application, onOpen, onDragStart, isDragging }) {
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        // Firefox refuses to start a drag unless something is set here
        e.dataTransfer.setData("text/plain", application.id);
        onDragStart(application);
      }}
      onClick={() => onOpen(application.id)}
      className={`cursor-pointer rounded-lg border border-line bg-white p-3.5 transition-all hover:border-ink/25 active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <p className="truncate text-[14.5px] font-medium">{application.candidate?.fullName}</p>
      <p className="mt-0.5 truncate text-[12.5px] text-muted">{application.job?.title}</p>

      {application.headline && (
        <p className="mt-2 line-clamp-2 text-[12.5px] leading-snug text-muted">
          {application.headline}
        </p>
      )}

      {!!application.skills?.length && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {application.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded bg-accent-soft px-1.5 py-0.5 text-[11.5px] text-accent">
              {s}
            </span>
          ))}
          {application.skills.length > 3 && (
            <span className="px-1 py-0.5 text-[11.5px] text-muted">
              +{application.skills.length - 3}
            </span>
          )}
        </div>
      )}

      <p className="mt-2.5 text-[12px] text-muted">{relativeTime(application.appliedAt)}</p>
    </li>
  );
}