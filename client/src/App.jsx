import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import SessionsPage from "./pages/SessionsPage";
import EditSessionPage from "./pages/EditSessionPage";
import CreateSessionPage from "./pages/CreateSessionPage";
import "./pages/Sessions.css";
import ParticipantsPage from "./pages/ParticipantsPage";
import CreateParticipantPage from "./pages/CreateParticipantPage";
import ParticipantDetailsPage from "./pages/ParticipantDetailsPage";
import SessionParticipantsPage from "./pages/SessionParticipantsPage";
import CompleteSessionPage from "./pages/CompleteSessionPage";

function App() {
  return (
    <>
    <nav className="app-nav" aria-label="Main navigation">
      <span className="app-brand">Interview practice</span>
      <div className="app-nav-links">
        <NavLink to="/sessions">Sessions</NavLink>
        <NavLink to="/participants">Participants</NavLink>
      </div>
    </nav>
    <Routes>
      <Route path="/" element={<Navigate to="/sessions" replace />} />
      <Route path="/sessions" element={<SessionsPage />} />
      <Route path="/sessions/new" element={<CreateSessionPage />} />
      <Route path="/sessions/:id/edit" element={<EditSessionPage />} />
      <Route path="/sessions/:id/complete" element={<CompleteSessionPage />} />
      <Route path="/sessions/:id/participants" element={<SessionParticipantsPage />} />
      <Route path="/participants" element={<ParticipantsPage />} />
      <Route path="/participants/new" element={<CreateParticipantPage />} />
      <Route path="/participants/:id" element={<ParticipantDetailsPage />} />
    </Routes>
    </>
  );
}

export default App;
