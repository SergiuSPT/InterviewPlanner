import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import usePageData from "../hooks/usePageData";
import RequestError from "../components/RequestError";
import { getSessionById } from "../services/sessionService";
import { getParticipants, getSessionParticipants, assignParticipant, removeParticipant } from "../services/participantService";

async function loadSessionGroup(id) {
  const [session, participants, assigned] = await Promise.all([
    getSessionById(id), getParticipants(), getSessionParticipants(id),
  ]);
  return { session, participants, assigned };
}

function ParticipantManager({ session, participants, assigned: initialAssigned }) {
  const [assigned, setAssigned] = useState(initialAssigned);
  const [participantId, setParticipantId] = useState("");
  const [participantRole, setParticipantRole] = useState("candidate");
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const available = participants.filter((participant) => !assigned.some((entry) => entry.id === participant.id));

  async function handleAssign(event) {
    event.preventDefault();
    if (pending || !participantId) return;
    setPending("assign");
    setError(null);
    setNotice("");
    try {
      const assignment = await assignParticipant(session.id, { participantId, participantRole });
      const participant = participants.find((entry) => entry.id === assignment.participantId);
      setAssigned((current) => [...current, {
        ...participant, participantRole: assignment.participantRole, assignedAt: assignment.createdAt,
      }].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      setParticipantId("");
      setNotice(`${participant.fullName} was added to this session.`);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setPending(null);
    }
  }

  async function handleRemove(participant) {
    if (pending || !window.confirm(`Remove ${participant.fullName} from this session? Their profile will be kept.`)) return;
    setPending(participant.id);
    setError(null);
    setNotice("");
    try {
      await removeParticipant(session.id, participant.id);
      setAssigned((current) => current.filter((entry) => entry.id !== participant.id));
      setNotice(`${participant.fullName} was removed from this session.`);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setPending(null);
    }
  }

  return <>
    <header className="session-page-heading">
      <p className="session-eyebrow">PRACTICE TOGETHER</p>
      <h1>{session.title}</h1>
      <p>Manage the candidates and interviewers for this session.</p>
      <p className="session-schedule">
        {session.scheduledAt
          ? `Scheduled for: ${new Date(session.scheduledAt).toLocaleString()} (${session.durationMinutes ?? 60} minutes${session.durationMinutes == null ? "; default duration" : ""}).`
          : "No scheduled time. Availability cannot be checked until this session is scheduled."}
      </p>
    </header>
    <RequestError error={error} />
    <p className={notice ? "session-notice" : ""} role="status">{notice}</p>
    <form className="session-form" onSubmit={handleAssign} aria-busy={pending === "assign"}>
      <div className="form-intro"><h2>Add a participant</h2><p>Choose a profile and their role in this interview.</p></div>
      {available.length > 0 ? <>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="participantId">Participant</label>
            <select id="participantId" value={participantId} onChange={(event) => { setParticipantId(event.target.value); setError(null); setNotice(""); }} required disabled={!!pending}>
              <option value="">Select a participant</option>
              {available.map((participant) => <option key={participant.id} value={participant.id}>{participant.fullName}{participant.email ? ` (${participant.email})` : ""}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="participantRole">Session role</label>
            <select id="participantRole" value={participantRole} onChange={(event) => setParticipantRole(event.target.value)} disabled={!!pending}>
              <option value="candidate">Candidate</option><option value="interviewer">Interviewer</option>
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button className="session-button session-button-primary" disabled={!!pending || !participantId}>{pending === "assign" ? "Adding..." : "Add to session"}</button>
        </div>
      </> : <p className="muted-text">{participants.length === 0 ? "Create a participant profile first, then return here to assign them." : "All available participants are already assigned to this session."}</p>}
      <Link className="inline-link" to="/participants/new">Create a new participant</Link>
    </form>
    <header className="section-heading"><h2>Assigned participants</h2><p>{assigned.length} {assigned.length === 1 ? "person" : "people"} in this session</p></header>
    {assigned.length === 0 && <p className="session-state">No participants assigned yet. Add a candidate or interviewer above.</p>}
    <section className="session-grid" aria-label="Assigned participants">
      {assigned.map((participant) => <article className="session-card" key={participant.id}>
        <h2>{participant.fullName}</h2>
        <p className="participant-email">{participant.email || "No email provided"}</p>
        <dl className="session-details">
          <div><dt>Session role</dt><dd><span className="session-status">{participant.participantRole}</span></dd></div>
          <div><dt>Experience</dt><dd>{participant.experienceLevel || "Not specified"}</dd></div>
          <div><dt>Current role</dt><dd>{participant.currentRole || "Not specified"}</dd></div>
        </dl>
        <div className="session-card-actions">
          <Link className="session-button session-button-secondary" to={`/participants/${participant.id}`}>View profile</Link>
          <button className="session-button session-button-danger" type="button" disabled={!!pending} onClick={() => handleRemove(participant)} aria-label={`Remove ${participant.fullName} from this session`}>
            {pending === participant.id ? "Removing..." : "Remove"}
          </button>
        </div>
      </article>)}
    </section>
  </>;
}

export default function SessionParticipantsPage() {
  const { id } = useParams();
  const { data, error, isLoading } = usePageData(loadSessionGroup, id);
  return (
    <main className="session-page">
      <Link className="back-link" to="/sessions">&larr; Back to sessions</Link>
      {isLoading && <p className="session-state" role="status">Loading session participants...</p>}
      {error && <p className="session-alert" role="alert">{error}</p>}
      {data && <ParticipantManager key={id} {...data} />}
    </main>
  );
}
