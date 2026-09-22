export default function SessionFeedback({ feedback = [] }) {
  return (
    <section className="session-feedback" aria-label="Candidate feedback">
      <h3>Feedback</h3>
      {feedback.length === 0 ? (
        <p className="muted-text">No feedback recorded for this candidate yet.</p>
      ) : feedback.map((entry) => (
        <article className="feedback-entry" key={entry.id}>
          <dl className="session-details feedback-summary">
            <div><dt>Overall score</dt><dd>{entry.overallScore} / 5</dd></div>
            <div><dt>Outcome</dt><dd>{entry.outcome.replaceAll("_", " ")}</dd></div>
            <div><dt>Reviewer</dt><dd>{entry.reviewerName || "Not available"}</dd></div>
            {entry.recommendation && <div><dt>Recommendation</dt><dd>{entry.recommendation.replaceAll("_", " ")}</dd></div>}
          </dl>
          {entry.createdAt && <p className="session-schedule">Recorded on: {new Date(entry.createdAt).toLocaleString()}</p>}
          <div className="feedback-text">
            <h4>Strengths</h4>
            <p>{entry.strengths}</p>
          </div>
          <div className="feedback-text">
            <h4>Improvement areas</h4>
            <p>{entry.improvementAreas}</p>
          </div>
          {entry.additionalComments && <div className="feedback-text">
            <h4>Additional comments</h4>
            <p>{entry.additionalComments}</p>
          </div>}
        </article>
      ))}
    </section>
  );
}
