import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../../features/auth/components/AuthShell";
import { forgotPasswordRequest, parseApiError } from "../../features/auth/api/authApi";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});
    try {
      await forgotPasswordRequest(email);
      setSent(true); // same response whether or not the email exists, see authApi
    } catch (err) {
      setFieldErrors(parseApiError(err).fieldErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell eyebrow="Account recovery" steps={["Request a reset link", "Choose a new password"]} activeStep={0}>
      <h1 className="font-display text-[32px] font-600 leading-tight tracking-[-0.02em]">Forgot your password?</h1>
      <p className="mt-2 text-[15px] text-muted">
        Enter your email and we'll send you a link to reset it.
      </p>

      {sent ? (
        <div className="mt-6 rounded-lg border border-line bg-white px-4 py-3 text-[14px] text-ink">
          If that email is registered, a reset link is on its way. Check the server console for the link during local development.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
          <TextField
            label="Email" name="email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email} autoComplete="email" autoFocus
          />
          <Button type="submit" loading={loading}>Send reset link</Button>
        </form>
      )}

      <p className="mt-6 text-[14px] text-muted">
        <Link to="/login" className="font-medium text-accent hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
