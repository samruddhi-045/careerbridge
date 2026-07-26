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
import Company from "../pages/company/Company";
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
    children: [{ path: "/candidate/profile", element: <CandidateProfile /> }],
  },
  {
    element: <ProtectedRoute roles={["recruiter", "company_admin"]} />,
    children: [{ path: "/company", element: <Company /> }],
  },
]);

export default router;
