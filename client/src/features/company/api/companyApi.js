import api from "../../../lib/axios";

export const createCompanyRequest = (payload) =>
  api.post("/companies", payload).then((r) => r.data);

export const joinCompanyRequest = (companyId) =>
  api.post(`/companies/${companyId}/join`).then((r) => r.data);

export const searchCompaniesRequest = (q) =>
  api.get("/companies/search", { params: { q } }).then((r) => r.data);

export const getMyCompanyRequest = () => api.get("/companies/me").then((r) => r.data);

export const updateCompanyRequest = (companyId, payload) =>
  api.patch(`/companies/${companyId}`, payload).then((r) => r.data);
