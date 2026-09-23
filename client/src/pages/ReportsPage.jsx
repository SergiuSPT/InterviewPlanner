import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import usePageData from "../hooks/usePageData";
import { getParticipants } from "../services/participantService";
import { getOverviewReport } from "../services/reportService";
import "./ReportsPage.css";

const formatScore = (score) => score == null ? "No scores yet" : `${Number(score).toFixed(2)} / 5`;
const formatLabel = (value) => value.replaceAll("_", " ");

function ReportData({ participantId }) {
  const { data, error, isLoading } = usePageData(getOverviewReport, participantId);

  if (isLoading) return <p className="session-state" role="status">Loading report...</p>;
  if (error) return <p className="session-alert" role="alert">{error}</p>;

  const { summary, activityByMonth, scoreTrend, outcomeDistribution, performanceByType } = data;
  const maxActivity = Math.max(1, ...activityByMonth.map((item) => item.totalSessions));
  const totalOutcomes = outcomeDistribution.reduce((total, item) => total + item.count, 0);
  const metrics = [
    ["Total sessions", summary.totalSessions],
    ["Completed", summary.completedSessions],
    ["Planned", summary.plannedSessions],
    ["In progress", summary.inProgressSessions],
    ["Completion rate", `${summary.completionRate}%`],
    ["Average score", formatScore(summary.averageScore)],
  ];

  return <>
    <dl className="report-metrics" aria-label="Report summary">
      {metrics.map(([label, value]) => <div className="report-metric" key={label}>
        <dt>{label}</dt><dd>{value}</dd>
      </div>)}
    </dl>
    {summary.totalSessions === 0 && <section className="session-state session-empty report-empty">
      <h2>No sessions to report</h2>
      <p>{participantId ? "This participant has no sessions as a candidate yet." : "Create a session to start tracking interview practice."}</p>
      <Link className="session-button session-button-primary" to="/sessions">Browse sessions</Link>
    </section>}

    <div className="report-grid">
      <section className="session-card report-panel" aria-labelledby="report-activity">
        <h2 id="report-activity">Monthly activity</h2>
        <p className="muted-text">Sessions created in the last six months, grouped by creation month.</p>
        {activityByMonth.length === 0 ? <p className="report-placeholder">No activity in the last six months.</p> : <ul className="report-bars">
          {activityByMonth.map((item) => <li key={item.month}>
            <div className="report-bar-label"><strong>{new Date(`${item.month}-01T00:00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</strong><span>{item.totalSessions} total · {item.completedSessions} completed</span></div>
            <div className="report-bar-track" aria-hidden="true"><div className="report-bar-total" style={{ width: `${item.totalSessions / maxActivity * 100}%` }}><div className="report-bar-completed" style={{ width: `${item.totalSessions ? item.completedSessions / item.totalSessions * 100 : 0}%` }} /></div></div>
          </li>)}
        </ul>}
        {activityByMonth.length > 0 && <p className="muted-text">Dark purple shows completed sessions.</p>}
      </section>

      <section className="session-card report-panel" aria-labelledby="report-outcomes">
        <h2 id="report-outcomes">Feedback outcomes</h2>
        <p className="muted-text">Distribution across recorded feedback.</p>
        {outcomeDistribution.length === 0 ? <p className="report-placeholder">No feedback outcomes yet.</p> : <ul className="report-bars">
          {outcomeDistribution.map((item) => <li key={item.outcome}>
            <div className="report-bar-label"><strong className="report-label">{formatLabel(item.outcome)}</strong><span>{item.count} ({totalOutcomes ? Math.round(item.count / totalOutcomes * 100) : 0}%)</span></div>
            <div className="report-bar-track" aria-hidden="true"><div className="report-bar-completed" style={{ width: `${totalOutcomes ? item.count / totalOutcomes * 100 : 0}%` }} /></div>
          </li>)}
        </ul>}
      </section>

      <section className="session-card report-panel" aria-labelledby="report-performance">
        <h2 id="report-performance">Performance by interview type</h2>
        <p className="muted-text">Average feedback scores on a scale of 1 to 5.</p>
        {performanceByType.length === 0 ? <p className="report-placeholder">Complete an interview with feedback to see performance.</p> : <div className="report-table-scroll" tabIndex={0} role="region" aria-label="Performance by interview type">
          <table className="report-table">
            <thead><tr><th scope="col">Interview type</th><th scope="col">Feedback</th><th scope="col">Average score</th></tr></thead>
            <tbody>{performanceByType.map((item) => <tr key={item.interviewType}><th scope="row" className="report-label">{formatLabel(item.interviewType)}</th><td>{item.feedbackCount}</td><td>{formatScore(item.averageScore)}</td></tr>)}</tbody>
          </table>
        </div>}
      </section>

      <section className="session-card report-panel" aria-labelledby="report-scores">
        <h2 id="report-scores">Scores over time</h2>
        <p className="muted-text">Feedback for completed sessions, from oldest to newest.</p>
        {scoreTrend.length === 0 ? <p className="report-placeholder">No completed session scores yet.</p> : <div className="report-table-scroll" tabIndex={0} role="region" aria-label="Scores over time">
          <table className="report-table">
            <thead><tr><th scope="col">Session</th><th scope="col">Completed</th><th scope="col">Score</th></tr></thead>
            <tbody>{scoreTrend.map((item, index) => <tr key={`${item.sessionId}-${index}`}>
              <th scope="row"><Link to={`/sessions/${item.sessionId}/participants`}>{item.title}</Link></th>
              <td>{item.completedAt ? new Date(item.completedAt).toLocaleDateString() : "Not recorded"}</td>
              <td>{formatScore(item.overallScore)}</td>
            </tr>)}</tbody>
          </table>
        </div>}
      </section>
    </div>
  </>;
}

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const participantId = searchParams.get("participantId") || "";
  const [revision, setRevision] = useState(0);
  const { data: participants, error: participantsError, isLoading: participantsLoading } = usePageData(getParticipants, revision);

  return <main className="session-page reports-page">
    <header className="session-page-heading">
      <p className="session-eyebrow">TRACK YOUR PROGRESS</p>
      <h1>Reports</h1>
      <p>Explore interview activity, feedback outcomes, and performance over time.</p>
    </header>
    <div className="session-form report-filters">
      <div className="form-field">
        <label htmlFor="report-participant">Participant</label>
        <select id="report-participant" value={participantId} disabled={participantsLoading} aria-describedby="report-filter-hint" onChange={(event) => {
          const next = new URLSearchParams(searchParams);
          if (event.target.value) next.set("participantId", event.target.value);
          else next.delete("participantId");
          setSearchParams(next);
        }}>
          <option value="">All participants</option>
          {participantId && !participants?.some((item) => item.id === participantId) && <option value={participantId}>Selected participant</option>}
          {participants?.map((participant) => <option value={participant.id} key={participant.id}>{participant.fullName}{participant.email ? ` (${participant.email})` : ""}</option>)}
        </select>
        <small id="report-filter-hint">Selecting a participant shows their sessions and feedback as a candidate.</small>
      </div>
      <button className="session-button session-button-secondary" type="button" onClick={() => setRevision((value) => value + 1)}>Refresh reports</button>
    </div>
    {participantsLoading && <p className="muted-text" role="status">Loading participant filter...</p>}
    {participantsError && <p className="session-alert" role="alert">Could not load the participant filter. {participantsError} Use Refresh reports to retry.</p>}
    <ReportData key={revision} participantId={participantId} />
  </main>;
}
