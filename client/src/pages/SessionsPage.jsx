import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSessions, completeSession } from "../services/sessionService";

function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingSessionId, setUpdatingSessionId] = useState(null);

  useEffect(() => {
    async function loadSessions() {
      try {
        const sessionData = await getSessions();
        setSessions(sessionData);
      } catch (requestError) {
        console.error(requestError);
        setError("Could not load interview sessions.");
      } finally {
        setIsLoading(false);
      }
    }

    loadSessions();
  }, []);

  if (isLoading) {
    return <main className="session-page"><p className="session-state" role="status">Loading sessions...</p></main>;
  }

  async function handleComplete(sessionId) {
    const shouldComplete = window.confirm(
      "Mark this interview session as completed?",
    );

    if (!shouldComplete) {
      return;
    }

    try {
      setUpdatingSessionId(sessionId);
      setError("");

      const updatedSession = await completeSession(sessionId);

      setSessions((currentSessions) =>
        currentSessions.map((session) =>
          session.id === sessionId ? updatedSession : session,
        ),
      );
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError.response?.data?.message ||
          "Could not complete the interview session.",
      );
    } finally {
      setUpdatingSessionId(null);
    }
  }

  return (
    <main className="session-page">
      <header className="session-page-heading session-list-heading">
        <div>
          <p className="session-eyebrow">YOUR PRACTICE SPACE</p>
          <h1>Interview Sessions</h1>
          <p>Prepare, conduct and review your mock interviews.</p>
        </div>

        <Link className="session-button session-button-primary" to="/sessions/new"><span aria-hidden="true">+</span> Create session</Link>
      </header>

      {error && <p className="session-alert" role="alert">{error}</p>}

      {!error && sessions.length === 0 && (
        <section className="session-state session-empty">
          <span className="empty-symbol" aria-hidden="true">+</span>
          <h2>No sessions yet</h2>
          <p>Create your first mock interview session.</p>
          <Link className="session-button session-button-primary" to="/sessions/new">Create your first session</Link>
        </section>
      )}

      <section className="session-grid" aria-label="Interview sessions">
        {sessions.map((session) => (
          <article className="session-card" key={session.id}>
            <h2>{session.title}</h2>

            <dl className="session-details">
              <div>
                <dt>Type</dt>
                <dd>{session.interviewType.replaceAll("_", " ")}</dd>
              </div>

              <div>
                <dt>Difficulty</dt>
                <dd>{session.difficulty}</dd>
              </div>

              <div>
                <dt>Status</dt>
                <dd><span className={`session-status session-status-${session.status}`}>{session.status.replaceAll("_", " ")}</span></dd>
              </div>

              <div>
                <dt>Duration</dt>
                <dd>
                  {session.durationMinutes
                    ? `${session.durationMinutes} minutes`
                    : "Not specified"}
                </dd>
              </div>
            </dl>

            {session.scheduledAt && (
              <p className="session-schedule">
                Scheduled for:{" "}
                {new Date(session.scheduledAt).toLocaleString()}
              </p>
            )}

            {session.status === "completed" && session.completedAt && (
              <p className="session-schedule">
                Completed on:{" "}
                {new Date(session.completedAt).toLocaleString()}
              </p>
            )}

            {session.notes && <p className="session-notes">{session.notes}</p>}

            <div className="session-card-actions">
              <Link className="session-button session-button-secondary" to={`/sessions/${session.id}/edit`}>
                Edit
              </Link>

              {session.status !== "completed" && (
                <button
                  className="session-button session-button-primary"
                  type="button"
                  disabled={updatingSessionId === session.id}
                  onClick={() => handleComplete(session.id)}
                >
                  {updatingSessionId === session.id
                    ? "Completing..."
                    : "Mark completed"}
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default SessionsPage;
