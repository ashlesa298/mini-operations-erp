const TONES = {
  ASSIGNED: "neutral",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  REQUESTED: "neutral",
  DISPATCHED: "info",
  RECEIVED: "success",
  PENDING: "neutral",
  RESERVED: "info",
  CANCELLED: "danger",
  FULFILLED: "success",
};

export default function StatusBadge({ status }) {
  const tone = TONES[status] || "neutral";
  return <span className={`badge badge-${tone}`}>{status?.replace("_", " ")}</span>;
}