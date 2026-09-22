import { Link, useParams } from "react-router-dom";
import usePageData from "../hooks/usePageData";
import { getParticipantById, getParticipantHistory } from "../services/participantService";

async function loadProfile(id) {
  const [participant, sessions] = await Promise.all([getParticipantById(id), getParticipantHistory(id)]);
  return { participant, sessions };
}

export default function ParticipantDetailsPage() {
  const { id } = useParams();
  const { data, error, isLoading } = usePageData(loadProfile, id);

  return (
    <main className="session-page">
      <Link className="back-link" to="/participants">&larr; Back to participants</Link>
      {isLoading && <p className="session-state" role="status">Loading participant...</p>}
      {error && <p className="session-alert" role="alert">{error}</p>}
      {data && <>
        <header className="session-page-heading">
          <p className="session-eyebrow">PARTICIPANT PROFILE</p>
          <h1>{data.participant.fullName}</h1>
          <p className="participant-email">{data.participant.email || "No email provided"}</p>
        </header>
        <section className="session-card profile-summary" aria-label="Participant details">
          <h2>About this participant</h2>
          <dl className="session-details">
            <div><dt>Current role</dt><dd>{data.participant.currentRole || "Not specified"}</dd></div>
            <div><dt>Experience</dt><dd>{data.participant.experienceLevel || "Not specified"}</dd></div>
          </dl>
          {data.participant.notes && <p className="session-notes">{data.participant.notes}</p>}
        </section>
        <header className="section-heading">
          <h2>Session history</h2>
          <p>{data.sessions.length} assigned {data.sessions.length === 1 ? "session" : "sessions"}</p>
        </header>
        {data.sessions.length === 0 && <section className="session-state session-empty">
          <h2>No sessions yet</h2>
          <p>Open a session to assign this participant.</p>
          <Link className="session-button session-button-primary" to="/sessions">Browse sessions</Link>
        </section>}
        <section className="session-grid" aria-label="Session history">
          {data.sessions.map((session) => <article className="session-card" key={session.id}>
            <h2>{session.title}</h2>
            <dl className="session-details">
              <div><dt>Participation role</dt><dd>{session.participantRole}</dd></div>
              <div><dt>Status</dt><dd><span className={`session-status session-status-${session.status}`}>{session.status.replaceAll("_", " ")}</span></dd></div>
              <div><dt>Type</dt><dd>{session.interviewType.replaceAll("_", " ")}</dd></div>
              <div><dt>Difficulty</dt><dd>{session.difficulty}</dd></div>
              <div><dt>Duration</dt><dd>{session.durationMinutes ? `${session.durationMinutes} minutes` : "Not specified"}</dd></div>
            </dl>
            {session.scheduledAt && <p className="session-schedule">Scheduled for: {new Date(session.scheduledAt).toLocaleString()}</p>}
            {session.completedAt && <p className="session-schedule">Completed on: {new Date(session.completedAt).toLocaleString()}</p>}
            <div className="session-card-actions">
              <Link className="session-button session-button-secondary" to={`/sessions/${session.id}/participants`}>View session participants</Link>
              <Link className="session-button session-button-secondary" to={`/sessions/${session.id}/edit`}>Edit session</Link>
            </div>
          </article>)}
        </section>
      </>}
    </main>
  );
}
