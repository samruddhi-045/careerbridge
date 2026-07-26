import api from "../../../lib/axios";

export const getMyProfileRequest = () => api.get("/candidates/me").then((r) => r.data);

export const createMyProfileRequest = (payload) =>
  api.post("/candidates/me", payload).then((r) => r.data);

export const updateMyProfileRequest = (payload) =>
  api.patch("/candidates/me", payload).then((r) => r.data);

export const deleteMyProfileRequest = () => api.delete("/candidates/me").then((r) => r.data);
