import api from "../../../lib/axios";

export const registerRequest = (role, payload) =>
  api.post(`/auth/register/${role}`, payload).then((r) => r.data);

export const loginRequest = (payload) =>
  api.post("/auth/login", payload).then((r) => r.data);

export const refreshRequest = () => api.post("/auth/refresh").then((r) => r.data);

export const logoutRequest = () => api.post("/auth/logout").then((r) => r.data);

export const verifyEmailRequest = (token) =>
  api.get(`/auth/verify-email/${token}`).then((r) => r.data);

export const resendVerificationRequest = (email) =>
  api.post("/auth/resend-verification", { email }).then((r) => r.data);

export const forgotPasswordRequest = (email) =>
  api.post("/auth/forgot-password", { email }).then((r) => r.data);

export const resetPasswordRequest = (token, password) =>
  api.post(`/auth/reset-password/${token}`, { password }).then((r) => r.data);

// turns an API error into { message, fieldErrors } so the form can show
// errors next to the right input instead of one generic message
export const parseApiError = (error) => {
  const payload = error?.response?.data?.error;
  if (!payload) {
    return { message: "Can't reach the server. Is it running on port 5000?", fieldErrors: {} };
  }
  const fieldErrors = {};
  (payload.details || []).forEach((d) => { fieldErrors[d.field] = d.message; });
  return { message: payload.message, fieldErrors };
};