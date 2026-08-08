import { STATUS_LABELS, STATUS_STYLES } from "../applicationConstants";

export default function StatusBadge({ status, size = "sm" }) {
  const padding = size === "lg" ? "px-3 py-1 text-[13.5px]" : "px-2 py-0.5 text-[12.5px]";

  return (
    <span className={`rounded-md font-medium ${padding} ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}