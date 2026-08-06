import api from "../../../lib/axios";

// Browsing is public — these work signed out. The axios instance adds the
// bearer token when there is one, which is how saved-state comes back marked.
export const searchJobsRequest = (params = {}) =>
  api.get("/jobs", { params }).then((r) => r.data);

export const getPublicJobRequest = (id) => api.get(`/jobs/${id}`).then((r) => r.data);

export const saveJobRequest = (id) => api.post(`/jobs/${id}/save`).then((r) => r.data);

export const unsaveJobRequest = (id) => api.delete(`/jobs/${id}/save`).then((r) => r.data);

export const listSavedJobsRequest = (params = {}) =>
  api.get("/jobs/saved", { params }).then((r) => r.data);