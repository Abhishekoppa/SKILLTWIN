import { apiClient } from "./client";

export interface Skill {
  name: string;
  category?: string;
}

export interface CandidateSkill {
  id: number;
  skill: Skill;
  claimed_confidence?: number;
  evidence_confidence?: number;
  demonstrated_score?: number;
  trend?: string;
}

export interface CandidateProfile {
  id: number;
  user_id: number;
  target_role?: string;
  candidate_skills: CandidateSkill[];
}

export const profileApi = {
  getSkillTwin: async (): Promise<CandidateProfile> => {
    const response = await apiClient.get<CandidateProfile>("/profile/skill-twin");
    return response.data;
  },
  
  analyzeProfile: async () => {
    const response = await apiClient.post("/profile/analyze");
    return response.data;
  }
};
