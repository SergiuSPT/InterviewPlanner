import { Link } from "react-router-dom";

function SessionForm({ form, onChange, onSubmit, isSubmitting, submitLabel, pendingLabel }) {
  return (
    <form className="session-form" onSubmit={onSubmit} aria-busy={isSubmitting}>
      <div className="form-intro">
        <h2>Session details</h2>
        <p>Set your focus and make time to practice. Only the title is required.</p>
      </div>

      <div className="form-grid">
        <div className="form-field form-field-wide">
          <label htmlFor="title">Session title <span className="required-mark">*</span></label>
          <input id="title" name="title" value={form.title} onChange={onChange} maxLength={150} placeholder="e.g. Frontend interview practice" required />
        </div>

        <div className="form-field">
          <label htmlFor="interviewType">Interview type</label>
          <select id="interviewType" name="interviewType" value={form.interviewType} onChange={onChange}>
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
            <option value="system_design">System design</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="difficulty">Difficulty</label>
          <select id="difficulty" name="difficulty" value={form.difficulty} onChange={onChange}>
            <option value="junior">Junior</option>
            <option value="mid">Mid-level</option>
            <option value="senior">Senior</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="scheduledAt">Scheduled date</label>
          <input id="scheduledAt" name="scheduledAt" type="datetime-local" value={form.scheduledAt} onChange={onChange} aria-describedby="schedule-hint" />
          <small id="schedule-hint">Optional. Choose a time in your local timezone.</small>
        </div>

        <div className="form-field">
          <label htmlFor="durationMinutes">Duration in minutes</label>
          <input id="durationMinutes" name="durationMinutes" type="number" min="1" max="480" value={form.durationMinutes} onChange={onChange} placeholder="60" />
        </div>

        <div className="form-field form-field-wide">
          <label htmlFor="notes">Preparation notes</label>
          <textarea id="notes" name="notes" rows="5" maxLength={5000} value={form.notes} onChange={onChange} placeholder="Topics to cover, questions to practice, or goals for this session…" />
        </div>
      </div>

      <div className="form-actions">
        <Link className="session-button session-button-secondary" to="/sessions">Cancel</Link>
        <button className="session-button session-button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default SessionForm;
