import "./SearchPage.css";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchApplication } from "../services/searchService";

const emptyResults = {
  sessions: [],
  participants: [],
  feedback: [],
};

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(
    searchParams.get("q") || "",
  );

  const [type, setType] = useState(
    searchParams.get("type") || "all",
  );

  const [results, setResults] = useState(emptyResults);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setError("Enter at least two characters.");
      return;
    }

    try {
      setIsSearching(true);
      setError("");

      const data = await searchApplication(
        trimmedQuery,
        type,
      );

      setResults(data.results);
      setHasSearched(true);

      setSearchParams({
        q: trimmedQuery,
        type,
      });
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError.response?.data?.message ||
          "Could not complete the search.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  const totalResults =
    results.sessions.length +
    results.participants.length +
    results.feedback.length;

  return (
    <main className="session-page search-page">
      <header className="session-page-heading">
        <p className="session-eyebrow">EXPLORE YOUR PRACTICE</p>
        <h1>Search</h1>
        <p>Find completed interviews, participant profiles, and feedback in one place.</p>
      </header>

      <form className="session-form search-panel" onSubmit={handleSubmit} role="search" aria-busy={isSearching}>
        <div className="search-controls">
          <div className="form-field">
            <label htmlFor="search-query">What are you looking for?</label>
            <input
              id="search-query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try React, a candidate name, or a skill..."
              aria-describedby="search-hint"
              minLength={2}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="search-type">Search in</label>
            <select id="search-type" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="all">Everything</option>
              <option value="sessions">Completed interviews</option>
              <option value="participants">Participants</option>
              <option value="feedback">Feedback</option>
            </select>
          </div>
          <button className="session-button session-button-primary" type="submit" disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>
        <p className="search-hint" id="search-hint">Enter at least two characters. Narrow your search by choosing a category.</p>
      </form>

      {error && <p className="session-alert" role="alert">{error}</p>}
      <div role="status" className="search-status">
        {isSearching ? "Searching interviews, participants, and feedback..." : hasSearched && !error ? (
          <><strong>{totalResults}</strong> result{totalResults === 1 ? "" : "s"} found</>
        ) : null}
      </div>

      {!hasSearched && !isSearching && !error && (
        <section className="session-state session-empty search-empty">
          <svg className="search-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m15.5 15.5 5 5" strokeLinecap="round" />
          </svg>
          <h2>Find your next insight</h2>
          <p>Search by interview topic, participant name, or words from feedback.</p>
        </section>
      )}

      {!isSearching && !error && <>
        {results.sessions.length > 0 && (
          <section className="search-result-section" aria-labelledby="interview-results-heading">
            <header className="search-section-heading">
              <h2 id="interview-results-heading">Completed interviews</h2>
              <span className="search-count">{results.sessions.length}</span>
            </header>
            <div className="session-grid">
              {results.sessions.map((session) => (
                <article className="session-card search-result-card" key={session.id}>
                  <h3>{session.title}</h3>
                  <div className="search-tags">
                    <span className="session-status">{session.interviewType.replaceAll("_", " ")}</span>
                    <span className="session-status">{session.difficulty}</span>
                  </div>
                  {session.completedAt && <p className="session-schedule">Completed {new Date(session.completedAt).toLocaleString()}</p>}
                  <div className="session-card-actions">
                    <Link className="session-button session-button-secondary" to={`/sessions/${session.id}/participants`}>View interview</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {results.participants.length > 0 && (
          <section className="search-result-section" aria-labelledby="participant-results-heading">
            <header className="search-section-heading">
              <h2 id="participant-results-heading">Participants</h2>
              <span className="search-count">{results.participants.length}</span>
            </header>
            <div className="session-grid">
              {results.participants.map((participant) => (
                <article className="session-card search-result-card" key={participant.id}>
                  <h3>{participant.fullName}</h3>
                  <p className="search-participant-role">{participant.currentRole || "Role not specified"}</p>
                  {participant.email && <p className="participant-email">{participant.email}</p>}
                  <div className="session-card-actions">
                    <Link className="session-button session-button-secondary" to={`/participants/${participant.id}`}>View history</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {results.feedback.length > 0 && (
          <section className="search-result-section" aria-labelledby="feedback-results-heading">
            <header className="search-section-heading">
              <h2 id="feedback-results-heading">Feedback</h2>
              <span className="search-count">{results.feedback.length}</span>
            </header>
            <div className="session-grid">
              {results.feedback.map((feedback) => (
                <article className="session-card search-result-card" key={feedback.id}>
                  <h3>{feedback.sessionTitle}</h3>
                  <p className="search-candidate">Candidate: <Link to={`/participants/${feedback.candidateId}`}>{feedback.candidateName}</Link></p>
                  <dl className="session-details search-feedback-summary">
                    <div><dt>Overall score</dt><dd>{feedback.overallScore} / 5</dd></div>
                    <div><dt>Outcome</dt><dd>{feedback.outcome.replaceAll("_", " ")}</dd></div>
                  </dl>
                  <div className="search-feedback-content">
                    <div className="feedback-text"><h4>Strengths</h4><p>{feedback.strengths}</p></div>
                    <div className="feedback-text"><h4>Improvement areas</h4><p>{feedback.improvementAreas}</p></div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {hasSearched && totalResults === 0 && (
          <section className="session-state session-empty search-empty">
            <h2>No matching results</h2>
            <p>Try a different keyword, check the spelling, or search in Everything.</p>
          </section>
        )}
      </>}
    </main>
  );
}

export default SearchPage;
