import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/auth/Login";
import CandidateSignup from "../pages/auth/CandidateSignup";
import RecruiterSignup from "../pages/auth/RecruiterSignup";
import VerifyEmail from "../pages/auth/VerifyEmail";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import Dashboard from "../pages/Dashboard";
import CandidateProfile from "../pages/candidate/CandidateProfile";
import MyResumes from "../pages/candidate/MyResumes";
import ResumeBuilder from "../pages/candidate/ResumeBuilder";
import Company from "../pages/company/Company";
import RecruiterJobs from "../pages/recruiter/RecruiterJobs";
import JobForm from "../pages/recruiter/JobForm";
import ProtectedRoute from "./ProtectedRoute";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/signup/candidate", element: <CandidateSignup /> },
  { path: "/signup/recruiter", element: <RecruiterSignup /> },
  { path: "/verify-email/:token", element: <VerifyEmail /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password/:token", element: <ResetPassword /> },
  {
    element: <ProtectedRoute />,
    children: [{ path: "/dashboard", element: <Dashboard /> }],
  },
  {
    element: <ProtectedRoute roles={["candidate"]} />,
    children: [
      { path: "/candidate/profile", element: <CandidateProfile /> },
      { path: "/candidate/resumes", element: <MyResumes /> },
      { path: "/candidate/resumes/:id", element: <ResumeBuilder /> },
    ],
  },
  {
    element: <ProtectedRoute roles={["recruiter", "company_admin"]} />,
    children: [
      { path: "/company", element: <Company /> },
      { path: "/recruiter/jobs", element: <RecruiterJobs /> },
      // "/new" must sit above "/:id" — otherwise the router reads "new" as a job id
      { path: "/recruiter/jobs/new", element: <JobForm /> },
      { path: "/recruiter/jobs/:id", element: <JobForm /> },
    ],
  },
]);

export default router;