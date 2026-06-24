import api from "./user.api";

export const registerPushToken = async (
  pushToken: string
): Promise<{ success: boolean; message: string }> => {
  const res = await api.post("/api/users/push-token", { pushToken });
  return res.data;
};

export const removePushToken = async (
  pushToken: string
): Promise<{ success: boolean; message: string }> => {
  const res = await api.post("/api/users/push-token/remove", { pushToken });
  return res.data;
};
