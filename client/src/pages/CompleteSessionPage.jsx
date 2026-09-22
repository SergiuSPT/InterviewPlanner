import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import RequestError from "../components/RequestError";
import usePageData from "../hooks/usePageData";
import { completeSession, getSessionById } from "../services/sessionService";
import { getSessionParticipants } from "../services/participantService";

async function loadCompletionData(id) {
  const [session, participants] = await Promise.all([
    getSessionById(id),
    getSessionParticipants(id),
  ]);
  return { session, participants };
}

function FeedbackForm({ session, participants }) {
  const navigate = useNavigate();
  const candidates = participants.filter((participant) => participant.participantRole === "candidate");
  const reviewers = participants.filter((participant) => participant.participantRole === "interviewer");
  const [form, setForm] = useState({
    candidateId: candidates.length === 1 ? candidates[0].id : "",
    reviewerId: reviewers.length === 1 ? reviewers[0].id : "",
    overallScore: "",
    strengths: "",
    improvementAreas: "",
    outcome: "",
    recommendation: "",
    additionalComments: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!form.strengths.trim() || !form.improvementAreas.trim()) {
      setError(new Error("Please enter strengths and improvement areas; these cannot be blank."));
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await completeSession(session.id, {
        ...form,
        overallScore: Number(form.overallScore),
        strengths: form.strengths.trim(),
        improvementAreas: form.improvementAreas.trim(),
        recommendation: form.recommendation || null,
        additionalComments: form.additionalComments.trim() || null,
      });
      navigate("/sessions", { replace: true });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (session.status === "completed") {
    return <section className="session-state session-empty">
      <h2>This session is already completed</h2>
      <p>Feedback cannot be submitted again.</p>
      <Link className="session-button session-button-secondary" to="/sessions">Back to sessions</Link>
    </section>;
  }

  if (!candidates.length || !reviewers.length) {
    return <section className="session-state session-empty">
      <h2>Assign participants first</h2>
      <p>This session needs at least one candidate and one interviewer before you can submit feedback.</p>
      <Link className="session-button session-button-primary" to={`/sessions/${session.id}/participants`}>Manage participants</Link>
    </section>;
  }

  return <>
    <RequestError error={error} />
    <form className="session-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
      <div className="form-intro">
        <h2>Interview feedback</h2>
        <p>Submitting this feedback will mark the session as completed. All fields are required unless marked optional.</p>
      </div>
      <fieldset className="feedback-fields" disabled={isSubmitting}>
        <legend className="visually-hidden">Interview feedback details</legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="candidateId">Candidate</label>
            <select id="candidateId" name="candidateId" value={form.candidateId} onChange={handleChange} required>
              <option value="">Select a candidate</option>
              {candidates.map((participant) => <option key={participant.id} value={participant.id}>{participant.fullName}{participant.email ? ` (${participant.email})` : ""}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="reviewerId">Reviewer</label>
            <select id="reviewerId" name="reviewerId" value={form.reviewerId} onChange={handleChange} required>
              <option value="">Select an interviewer</option>
              {reviewers.map((participant) => <option key={participant.id} value={participant.id}>{participant.fullName}{participant.email ? ` (${participant.email})` : ""}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="overallScore">Overall score (1–5)</label>
            <select id="overallScore" name="overallScore" value={form.overallScore} onChange={handleChange} required>
              <option value="">Select a score</option>
              {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="outcome">Outcome</label>
            <select id="outcome" name="outcome" value={form.outcome} onChange={handleChange} required>
              <option value="">Select an outcome</option>
              <option value="passed">Passed</option>
              <option value="needs_improvement">Needs improvement</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="form-field form-field-wide">
            <label htmlFor="strengths">Strengths</label>
            <textarea id="strengths" name="strengths" rows="4" maxLength={5000} value={form.strengths} onChange={handleChange} placeholder="What did the candidate do well?" required />
          </div>
          <div className="form-field form-field-wide">
            <label htmlFor="improvementAreas">Improvement areas</label>
            <textarea id="improvementAreas" name="improvementAreas" rows="4" maxLength={5000} value={form.improvementAreas} onChange={handleChange} placeholder="What should they focus on next?" required />
          </div>
          <div className="form-field form-field-wide">
            <label htmlFor="recommendation">Recommendation (optional)</label>
            <select id="recommendation" name="recommendation" value={form.recommendation} onChange={handleChange}>
              <option value="">No recommendation</option>
              <option value="strong_hire">Strong hire</option>
              <option value="hire">Hire</option>
              <option value="neutral">Neutral</option>
              <option value="no_hire">No hire</option>
              <option value="strong_no_hire">Strong no hire</option>
            </select>
          </div>
          <div className="form-field form-field-wide">
            <label htmlFor="additionalComments">Additional comments (optional)</label>
            <textarea id="additionalComments" name="additionalComments" rows="4" maxLength={5000} value={form.additionalComments} onChange={handleChange} />
          </div>
        </div>
      </fieldset>
      <div className="form-actions">
        <Link className="session-button session-button-secondary" to="/sessions">Cancel</Link>
        <button className="session-button session-button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Completing..." : "Submit feedback & complete"}</button>
      </div>
    </form>
  </>;
}

export default function CompleteSessionPage() {
  const { id } = useParams();
  const { data, error, isLoading } = usePageData(loadCompletionData, id);

  return (
    <main className="session-page session-page-form">
      <Link className="back-link" to="/sessions">&larr; Back to sessions</Link>
      <header className="session-page-heading">
        <p className="session-eyebrow">REFLECT ON YOUR PRACTICE</p>
        <h1>Complete interview session</h1>
        <p>{data ? data.session.title : "Record feedback and wrap up your interview."}</p>
      </header>
      {isLoading && <p className="session-state" role="status">Loading session...</p>}
      {error && <p className="session-alert" role="alert">{error}</p>}
      {data && <FeedbackForm key={id} {...data} />}
    </main>
  );
}
