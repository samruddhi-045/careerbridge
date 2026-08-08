import api from "../../../lib/axios";

export const listCompanyApplicationsRequest = (params = {}) =>
  api.get("/applications/company", { params }).then((r) => r.data);

export const getCompanyApplicationRequest = (id) =>
  api.get(`/applications/company/${id}`).then((r) => r.data);

export const changeApplicationStatusRequest = (id, status, note) =>
  api.patch(`/applications/company/${id}/status`, { status, note }).then((r) => r.data);