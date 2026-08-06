import api from "../../../lib/axios";

const BASE = "/recruiter/jobs";

export const listJobsRequest = (params = {}) =>
  api.get(BASE, { params }).then((r) => r.data);

export const getJobRequest = (id) => api.get(`${BASE}/${id}`).then((r) => r.data);

export const createJobRequest = (payload) => api.post(BASE, payload).then((r) => r.data);

export const updateJobRequest = (id, payload) =>
  api.patch(`${BASE}/${id}`, payload).then((r) => r.data);

// Status has its own endpoint because the server enforces which transitions
// are legal -- it isn't just another editable field.
export const changeJobStatusRequest = (id, status) =>
  api.patch(`${BASE}/${id}/status`, { status }).then((r) => r.data);

export const deleteJobRequest = (id) => api.delete(`${BASE}/${id}`).then((r) => r.data);