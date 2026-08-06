import api from "../../../lib/axios";

export const listResumesRequest = (params = {}) =>
  api.get("/resumes", { params }).then((r) => r.data);

export const getResumeRequest = (id) => api.get(`/resumes/${id}`).then((r) => r.data);

export const createResumeRequest = (payload) =>
  api.post("/resumes", payload).then((r) => r.data);

export const updateResumeRequest = (id, payload) =>
  api.patch(`/resumes/${id}`, payload).then((r) => r.data);

export const deleteResumeRequest = (id) => api.delete(`/resumes/${id}`).then((r) => r.data);

export const duplicateResumeRequest = (id) =>
  api.post(`/resumes/${id}/duplicate`).then((r) => r.data);