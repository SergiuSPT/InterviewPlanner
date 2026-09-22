import { api } from "./api";

export async function searchApplication(query, type = "all") {
  const response = await api.get("/search", {
    params: {
      q: query,
      type,
    },
  });

  return response.data;
}