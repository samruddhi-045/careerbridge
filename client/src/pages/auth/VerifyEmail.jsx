import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AuthShell from "../../features/auth/components/AuthShell";
import { verifyEmailRequest, parseApiError } from "../../features/auth/api/authApi";
import { useAuth } from "../../context/AuthContext";

export default function VerifyEmail() {
  const { token } = useParams();
  const { updateUser } = useAuth();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  // the verify-email link is one-time-use, so this request can't be repeated —
  // but React.StrictMode double-invokes effects in dev, which would otherwise
  // send it twice and show the second (failing) response instead of the first
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;

    verifyEmailRequest(token)
      .then((res) => {
        updateUser({ isEmailVerified: true });
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(parseApiError(err).message);
      });
    // token never changes for a mounted instance of this page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthShell eyebrow="Email verification" steps={["Confirm your email", "You're all set"]} activeStep={status === "success" ? 1 : 0}>
      <h1 className="font-display text-[32px] font-600 leading-tight tracking-[-0.02em]">
        {status === "verifying" && "Verifying your email…"}
        {status === "success" && "Email verified"}
        {status === "error" && "Verification failed"}
      </h1>

      {status === "verifying" && (
        <span className="mt-6 inline-block h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
      )}

      {status !== "verifying" && (
        <p className={`mt-3 text-[15px] ${status === "error" ? "text-danger" : "text-muted"}`}>{message}</p>
      )}

      <p className="mt-7 text-[14px] text-muted">
        <Link to={status === "success" ? "/dashboard" : "/login"} className="font-medium text-accent hover:underline">
          {status === "success" ? "Go to your dashboard" : "Back to sign in"}
        </Link>
      </p>
    </AuthShell>
  );
}
