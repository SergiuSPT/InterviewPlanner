import { Navigate, Route, Routes } from "react-router-dom";
import SessionsPage from "./pages/SessionsPage";
import EditSessionPage from "./pages/EditSessionPage";
import CreateSessionPage from "./pages/CreateSessionPage";
import "./pages/Sessions.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/sessions" replace />} />
      <Route path="/sessions" element={<SessionsPage />} />
      <Route path="/sessions/new" element={<CreateSessionPage />} />
      <Route path="/sessions/:id/edit" element={<EditSessionPage />} />
    </Routes>
  );
}

export default App;
