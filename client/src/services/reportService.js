import { api } from "./api";

export async function getOverviewReport(participantId) {
  const response = await api.get("/reports/overview", {
    params: participantId ? { participantId } : {},
  });
  return response.data;
}
