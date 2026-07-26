import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../../features/auth/components/AuthShell";
import { useAuth } from "../../context/AuthContext";
import { parseApiError } from "../../features/auth/api/authApi";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((f) => ({ ...f, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    setFieldErrors({});
    try {
      await login(values);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const parsed = parseApiError(err);
      setFieldErrors(parsed.fieldErrors);
      if (!Object.keys(parsed.fieldErrors).length) setFormError(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      steps={["Sign in", "Pick up where you left off"]}
      activeStep={0}
    >
      <h1 className="font-display text-[32px] font-600 leading-tight tracking-[-0.02em]">Sign in</h1>
      <p className="mt-2 text-[15px] text-muted">
        Use the email you signed up with. We'll take you to the right place.
      </p>

      {formError && (
        <div className="mt-6 rounded-lg border border-danger/25 bg-danger/[0.04] px-4 py-3 text-[14px] text-danger">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
        <TextField
          label="Email" name="email" type="email" value={values.email} onChange={handleChange}
          error={fieldErrors.email} autoComplete="email" autoFocus
        />
        <TextField
          label="Password" name="password" type="password" value={values.password} onChange={handleChange}
          error={fieldErrors.password} autoComplete="current-password"
        />
        <p className="text-right text-[13px]">
          <Link to="/forgot-password" className="font-medium text-accent hover:underline">Forgot password?</Link>
        </p>
        <Button type="submit" loading={loading}>Sign in</Button>
      </form>

      <p className="mt-6 text-[14px] text-muted">
        New here?{" "}
        <Link to="/signup/candidate" className="font-medium text-accent hover:underline">Join as a candidate</Link>
        {" or "}
        <Link to="/signup/recruiter" className="font-medium text-accent hover:underline">as a recruiter</Link>
      </p>
    </AuthShell>
  );
}