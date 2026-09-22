import { api } from "./api";

export async function getSessions() {
  const response = await api.get("/sessions");
  return response.data.sessions;
}

export async function getSessionById(sessionId) {
  const response = await api.get(`/sessions/${sessionId}`);
  return response.data.session;
}

export async function createSession(sessionData) {
  const response = await api.post("/sessions", sessionData);
  return response.data.session;
}

export async function updateSession(sessionId, sessionData) {
  const response = await api.patch(`/sessions/${sessionId}`, sessionData);
  return response.data.session;
}

export async function completeSession(sessionId, feedback) {
  const response = await api.patch(`/sessions/${sessionId}/complete`, feedback);
  return response.data.session;
}
