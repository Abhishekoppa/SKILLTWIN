import { apiClient } from "./client";

export const sourcesApi = {
  analyzeGithub: async (github_username: string) => {
    const response = await apiClient.post("/sources/github/analyze", { github_username });
    return response.data;
  }
};
