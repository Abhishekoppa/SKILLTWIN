import { apiClient } from "./client";

export const interviewApi = {
  startInterview: async () => {
    const response = await apiClient.post("/interviews/");
    return response.data;
  },
  
  submitAnswer: async (interviewId: number, questionId: number, answerText: string) => {
    const response = await apiClient.post(`/interviews/${interviewId}/answer`, {
      question_id: questionId,
      answer_text: answerText
    });
    return response.data;
  }
};
