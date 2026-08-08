import api from "../../../lib/axios";

export const getCandidateAnalyticsRequest = () =>
  api.get("/analytics/me").then((r) => r.data);

export const getRecruiterAnalyticsRequest = (params = {}) =>
  api.get("/analytics/company", { params }).then((r) => r.data);