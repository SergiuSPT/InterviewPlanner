import { Link } from "react-router-dom";

export default function RequestError({ error }) {
  if (!error) return null;
  const details = Object.values(error.response?.data?.errors || {}).flat();
  const conflict = error.response?.data?.code === "SCHEDULE_CONFLICT"
    ? error.response.data.conflictingSession
    : null;
  return (
    <div className="session-alert" role="alert">
      <p>{error.response?.data?.message || error.message || "Something went wrong. Please try again."}</p>
      {conflict && <div>
        <p><strong>{conflict.title}</strong></p>
        {conflict.scheduledAt && <p>
          {new Date(conflict.scheduledAt).toLocaleString()}
          {" – "}
          {new Date(new Date(conflict.scheduledAt).getTime() + (conflict.durationMinutes ?? 60) * 60_000).toLocaleString()}
        </p>}
        <p>Choose another participant or adjust the session schedule.</p>
        <Link className="inline-link" to={`/sessions/${conflict.id}/edit`}>View conflicting session</Link>
      </div>}
      {details.length > 0 && <ul>{details.map((message, index) => <li key={index}>{message}</li>)}</ul>}
    </div>
  );
}
