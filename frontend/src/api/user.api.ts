import axios from "axios";
import * as storage from "../utils/storage";

// ─── Base URL ────────────────────────────────────────────────────────────────
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.4:5137";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Attach token from storage to every request
api.interceptors.request.use(async (config) => {
  const token = await storage.getItemAsync("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error?.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url?.includes("/api/users/refresh-token")
    ) {
      return Promise.reject(error);
    }

    const refreshToken = await storage.getItemAsync("refreshToken");
    if (!refreshToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const res = await axios.post(`${BASE_URL}/api/users/refresh-token`, { refreshToken }, { withCredentials: true });
      const nextToken = res.data?.token;
      const nextRefreshToken = res.data?.refreshToken;
      if (!nextToken) {
        return Promise.reject(error);
      }
      await storage.setItemAsync("token", nextToken);
      if (nextRefreshToken) {
        await storage.setItemAsync("refreshToken", nextRefreshToken);
      }
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${nextToken}`;
      return api(originalRequest);
    } catch (refreshErr) {
      await storage.deleteItemAsync("token");
      await storage.deleteItemAsync("refreshToken");
      return Promise.reject(refreshErr);
    }
  }
);

export interface RegisterPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  gender: string;
  usertype: "individual" | "team" | "admin";
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserProfile {
  _id: string;
  username: { firstname: string; lastname: string };
  email: string;
  usertype: string;
  profilePic?: string;
  notificationPreferences?: {
    comments: boolean;
    assignments: boolean;
    mentions: boolean;
    reminders: boolean;
  };
  pinnedProjects?: string[];
  pinnedTasks?: string[];
}

// ─── API Functions ────────────────────────────────────────────────────────────
export const loginApi = async (payload: LoginPayload) => {
  const res = await api.post("/api/users/login", payload);
  return { success: true, ...res.data };
};

export const registerApi = async (payload: RegisterPayload) => {
  const res = await api.post("/api/users/new/register", {
    username: {
      firstname: payload.firstname,
      lastname: payload.lastname,
    },
    email: payload.email,
    password: payload.password,
    gender: payload.gender,
    usertype: payload.usertype,
    phone: payload.phone,
  });
  return { success: true, ...res.data };
};

export const getProfileApi = async () => {
  const res = await api.get("/api/users/profile");
  return { success: true, ...res.data };
};

export const refreshTokenApi = async (refreshToken: string) => {
  const res = await api.post("/api/users/refresh-token", { refreshToken });
  return { success: true, ...res.data };
};

export interface UpdateProfilePayload {
  firstname?: string;
  lastname?: string;
  age?: number;
  gender?: string;
  phone?: string;
}

export const updateProfileApi = async (payload: UpdateProfilePayload) => {
  const body: any = {};
  if (payload.firstname || payload.lastname) {
    body.username = {
      firstname: payload.firstname,
      lastname: payload.lastname,
    };
  }
  if (payload.age !== undefined) body.age = payload.age;
  if (payload.gender) body.gender = payload.gender;
  if (payload.phone) body.phone = payload.phone;

  const res = await api.put("/api/users/profile", body);
  return { success: true, ...res.data };
};

export const logoutApi = async () => {
  const res = await api.post("/api/users/logout");
  await storage.deleteItemAsync("token");
  await storage.deleteItemAsync("refreshToken");
  return { success: true, ...res.data };
};

export interface PreferencesPayload {
  comments?: boolean;
  assignments?: boolean;
  mentions?: boolean;
  reminders?: boolean;
}

export const updatePreferencesApi = async (payload: PreferencesPayload) => {
  const res = await api.put("/api/users/preferences", payload);
  return { success: true, ...res.data };
};

// Pinned Items API
export const pinProjectApi = async (projectId: string): Promise<{ success: boolean; pinnedProjects: string[] }> => {
  const res = await api.post(`/api/users/pin-project/${projectId}`);
  return res.data;
};

export const pinTaskApi = async (taskId: string): Promise<{ success: boolean; pinnedTasks: string[] }> => {
  const res = await api.post(`/api/users/pin-task/${taskId}`);
  return res.data;
};

export const getPinnedItemsApi = async (): Promise<{ success: boolean; pinnedProjects: any[]; pinnedTasks: any[] }> => {
  const res = await api.get("/api/users/pinned");
  return res.data;
};

// Profile avatar endpoint
export const uploadAvatarApi = async (formData: FormData): Promise<{ success: boolean; avatarUrl: string; user: any }> => {
  const res = await api.put("/api/users/profile/avatar", formData);
  return res.data;
};

export interface OAuthGooglePayload {
  idToken?: string;
  profile?: {
    email: string;
    firstname: string;
    lastname: string;
    googleId: string;
    avatarUrl?: string;
  };
}

export interface OAuthApplePayload {
  identityToken?: string;
  profile?: {
    email: string;
    firstname: string;
    lastname: string;
    appleId: string;
  };
}

export const loginGoogleApi = async (payload: OAuthGooglePayload) => {
  const res = await api.post("/api/users/oauth/google", payload);
  return { success: true, ...res.data };
};

export const loginAppleApi = async (payload: OAuthApplePayload) => {
  const res = await api.post("/api/users/oauth/apple", payload);
  return { success: true, ...res.data };
};

export const updateThemeColorApi = async (themeColor: string): Promise<{ success: boolean; user: any }> => {
  const res = await api.put("/api/users/theme", { themeColor });
  return res.data;
};

export default api;
