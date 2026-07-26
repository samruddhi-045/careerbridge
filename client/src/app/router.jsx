import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/auth/Login";
import CandidateSignup from "../pages/auth/CandidateSignup";
import RecruiterSignup from "../pages/auth/RecruiterSignup";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/signup/candidate", element: <CandidateSignup /> },
  { path: "/signup/recruiter", element: <RecruiterSignup /> },
  {
    element: <ProtectedRoute />,
    children: [{ path: "/dashboard", element: <Dashboard /> }],
  },
]);

export default router;