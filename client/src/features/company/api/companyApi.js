import api from "../../../lib/axios";

export const createCompanyRequest = (payload) =>
  api.post("/companies", payload).then((r) => r.data);

// Joining is by invite code now, not by company id -- ids from /search used to
// be enough to join any company.
export const joinCompanyRequest = (code) =>
  api.post("/companies/join", { code }).then((r) => r.data);

export const searchCompaniesRequest = (q) =>
  api.get("/companies/search", { params: { q } }).then((r) => r.data);

export const getMyCompanyRequest = () => api.get("/companies/me").then((r) => r.data);

export const updateCompanyRequest = (companyId, payload) =>
  api.patch(`/companies/${companyId}`, payload).then((r) => r.data);

// company_admin only
export const getInviteCodeRequest = () =>
  api.get("/companies/invite-code").then((r) => r.data);

export const regenerateInviteCodeRequest = () =>
  api.post("/companies/invite-code/regenerate").then((r) => r.data);