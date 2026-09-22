import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createParticipant } from "../services/participantService";
import RequestError from "../components/RequestError";

export default function CreateParticipantPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", currentRole: "", experienceLevel: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const participant = await createParticipant({
        fullName: form.fullName.trim(),
        email: form.email.trim() || null,
        currentRole: form.currentRole.trim() || null,
        experienceLevel: form.experienceLevel || null,
        notes: form.notes.trim() || null,
      });
      navigate(`/participants/${participant.id}`);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="session-page session-page-form">
      <Link className="back-link" to="/participants">&larr; Back to participants</Link>
      <header className="session-page-heading">
        <p className="session-eyebrow">GROW YOUR PRACTICE GROUP</p>
        <h1>Add participant</h1>
        <p>Create a profile, then assign them to a session as a candidate or interviewer.</p>
      </header>
      <RequestError error={error} />
      <form className="session-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <div className="form-intro"><h2>Participant details</h2><p>Only the full name is required.</p></div>
        <div className="form-grid">
          <div className="form-field form-field-wide">
            <label htmlFor="fullName">Full name <span className="required-mark">*</span></label>
            <input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} maxLength={150} pattern=".*\S.*" autoComplete="name" required />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} maxLength={255} />
          </div>
          <div className="form-field">
            <label htmlFor="currentRole">Current role</label>
            <input id="currentRole" name="currentRole" value={form.currentRole} onChange={handleChange} maxLength={150} placeholder="e.g. Frontend developer" />
          </div>
          <div className="form-field form-field-wide">
            <label htmlFor="experienceLevel">Experience level</label>
            <select id="experienceLevel" name="experienceLevel" value={form.experienceLevel} onChange={handleChange}>
              <option value="">Not specified</option><option value="junior">Junior</option><option value="mid">Mid-level</option><option value="senior">Senior</option>
            </select>
          </div>
          <div className="form-field form-field-wide">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" rows="5" value={form.notes} onChange={handleChange} maxLength={5000} placeholder="Background, interests, or areas to practice..." />
          </div>
        </div>
        <div className="form-actions">
          <Link className="session-button session-button-secondary" to="/participants">Cancel</Link>
          <button className="session-button session-button-primary" disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add participant"}</button>
        </div>
      </form>
    </main>
  );
}
