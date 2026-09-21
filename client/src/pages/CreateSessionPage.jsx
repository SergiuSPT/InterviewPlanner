import SessionForm from "../components/SessionForm";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createSession } from "../services/sessionService";

const initialForm = {
  title: "",
  interviewType: "technical",
  difficulty: "junior",
  scheduledAt: "",
  durationMinutes: "60",
  notes: "",
};

function CreateSessionPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");

    const sessionData = {
      title: form.title,
      interviewType: form.interviewType,
      difficulty: form.difficulty,
      scheduledAt: form.scheduledAt
        ? new Date(form.scheduledAt).toISOString()
        : null,
      durationMinutes: form.durationMinutes
        ? Number(form.durationMinutes)
        : null,
      notes: form.notes || null,
    };

    try {
      await createSession(sessionData);
      navigate("/sessions");
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError.response?.data?.message ||
          "Could not create the interview session.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="session-page session-page-form">
      <Link className="back-link" to="/sessions"><span aria-hidden="true">←</span> Back to sessions</Link>

      <header className="session-page-heading"><p className="session-eyebrow">PLAN YOUR PRACTICE</p><h1>Create interview session</h1><p>A little preparation goes a long way. Set up your next mock interview.</p></header>

      {error && <p className="session-alert" role="alert">{error}</p>}

      <SessionForm
        form={form}
        onChange={handleChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Create session"
        pendingLabel="Creating..."
      />
    </main>
  );
}

export default CreateSessionPage;