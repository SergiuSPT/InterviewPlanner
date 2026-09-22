import { Link } from "react-router-dom";
import usePageData from "../hooks/usePageData";
import { getParticipants } from "../services/participantService";

export default function ParticipantsPage() {
  const { data: participants, error, isLoading } = usePageData(getParticipants);

  return (
    <main className="session-page">
      <header className="session-page-heading session-list-heading">
        <div>
          <p className="session-eyebrow">PRACTICE TOGETHER</p>
          <h1>Participants</h1>
          <p>Meet your candidates and interviewers, and follow their practice.</p>
        </div>
        <Link className="session-button session-button-primary" to="/participants/new">+ Add participant</Link>
      </header>
      {isLoading && <p className="session-state" role="status">Loading participants...</p>}
      {error && <p className="session-alert" role="alert">{error}</p>}
      {participants?.length === 0 && (
        <section className="session-state session-empty">
          <h2>No participants yet</h2>
          <p>Add someone to start organizing interviews together.</p>
          <Link className="session-button session-button-primary" to="/participants/new">Add your first participant</Link>
        </section>
      )}
      <section className="session-grid" aria-label="Participants">
        {participants?.map((participant) => (
          <article className="session-card" key={participant.id}>
            <h2>{participant.fullName}</h2>
            <p className="participant-email">{participant.email || "No email provided"}</p>
            <dl className="session-details">
              <div><dt>Current role</dt><dd>{participant.currentRole || "Not specified"}</dd></div>
              <div><dt>Experience</dt><dd>{participant.experienceLevel || "Not specified"}</dd></div>
              <div><dt>Sessions</dt><dd>{participant.sessionCount}</dd></div>
            </dl>
            <div className="session-card-actions">
              <Link className="session-button session-button-secondary" to={`/participants/${participant.id}`}>View profile &amp; history</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
