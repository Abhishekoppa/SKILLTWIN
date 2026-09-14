import { apiClient } from "./client";
import type { User, UserCredentials, AuthResponse } from "../types/auth";

export const authApi = {
  login: async (credentials: UserCredentials): Promise<AuthResponse> => {
    // FastAPI OAuth2PasswordRequestForm expects form data
    const formData = new URLSearchParams();
    formData.append("username", credentials.email);
    formData.append("password", credentials.password);
    
    const response = await apiClient.post<AuthResponse>("/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  },
  
  register: async (credentials: UserCredentials): Promise<User> => {
    const response = await apiClient.post<User>("/auth/register", credentials);
    return response.data;
  },
  
  me: async (): Promise<User> => {
    const response = await apiClient.get<User>("/me");
    return response.data;
  },
};
