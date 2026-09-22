import { api } from "./api";

export async function getParticipants() {
  const response = await api.get("/participants");
  return response.data.participants;
}

export async function getParticipantById(id) {
  const response = await api.get(`/participants/${id}`);
  return response.data.participant;
}

export async function createParticipant(data) {
  const response = await api.post("/participants", data);
  return response.data.participant;
}

export async function getParticipantHistory(id) {
  const response = await api.get(`/participants/${id}/sessions`);
  return response.data.sessions;
}

export async function getSessionParticipants(sessionId) {
  const response = await api.get(`/sessions/${sessionId}/participants`);
  return response.data.participants;
}

export async function assignParticipant(sessionId, participantData) {
  const response = await api.post(`/sessions/${sessionId}/participants`, participantData);
  return response.data.assignment;
}

export async function removeParticipant(sessionId, participantId) {
  await api.delete(`/sessions/${sessionId}/participants/${participantId}`);
}
