import SessionForm from "../components/SessionForm";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getSessionById,
  updateSession,
} from "../services/sessionService";

function convertToLocalDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  const localDate = new Date(date.getTime() - timezoneOffset);

  return localDate.toISOString().slice(0, 16);
}

function EditSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSession() {
      try {
        const session = await getSessionById(id);

        setForm({
          title: session.title,
          interviewType: session.interviewType,
          difficulty: session.difficulty,
          scheduledAt: convertToLocalDateTime(
            session.scheduledAt,
          ),
          durationMinutes:
            session.durationMinutes?.toString() ?? "",
          notes: session.notes ?? "",
        });
      } catch (requestError) {
        console.error(requestError);

        setError(
          requestError.response?.data?.message ||
            "Could not load the interview session.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");

      await updateSession(id, {
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
      });

      navigate("/sessions");
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError.response?.data?.message ||
          "Could not update the interview session.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <main className="session-page session-page-form"><p className="session-state" role="status">Loading session...</p></main>;
  }

  if (!form) {
    return (
      <main className="session-page session-page-form">
        <p className="session-alert" role="alert">{error}</p>
        <Link className="back-link" to="/sessions"><span aria-hidden="true">←</span> Back to sessions</Link>
      </main>
    );
  }

  return (
    <main className="session-page session-page-form">
      <Link className="back-link" to="/sessions"><span aria-hidden="true">←</span> Back to sessions</Link>

      <header className="session-page-heading"><p className="session-eyebrow">REFINE YOUR PLAN</p><h1>Edit interview session</h1><p>Update the details and keep your interview preparation on track.</p></header>

      {error && <p className="session-alert" role="alert">{error}</p>}

      <SessionForm
        form={form}
        onChange={handleChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Save changes"
        pendingLabel="Saving..."
      />
    </main>
  );
}

export default EditSessionPage;