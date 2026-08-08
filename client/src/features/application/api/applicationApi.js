import api from "../../../lib/axios";

export const applyToJobRequest = (jobId, payload) =>
  api.post(`/applications/jobs/${jobId}/apply`, payload).then((r) => r.data);

export const listMyApplicationsRequest = (params = {}) =>
  api.get("/applications/me", { params }).then((r) => r.data);

export const getMyApplicationRequest = (id) =>
  api.get(`/applications/me/${id}`).then((r) => r.data);

export const withdrawApplicationRequest = (id) =>
  api.post(`/applications/me/${id}/withdraw`).then((r) => r.data);