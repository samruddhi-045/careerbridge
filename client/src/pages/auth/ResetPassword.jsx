import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthShell from "../../features/auth/components/AuthShell";
import { resetPasswordRequest, parseApiError } from "../../features/auth/api/authApi";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [values, setValues] = useState({ password: "", confirmPassword: "" });
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
    setFormError("");
    setFieldErrors({});

    if (values.password !== values.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords don't match" });
      return;
    }

    setLoading(true);
    try {
      await resetPasswordRequest(token, values.password);
      navigate("/login", { replace: true, state: { resetSuccess: true } });
    } catch (err) {
      const parsed = parseApiError(err);
      setFieldErrors(parsed.fieldErrors);
      if (!Object.keys(parsed.fieldErrors).length) setFormError(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell eyebrow="Account recovery" steps={["Request a reset link", "Choose a new password"]} activeStep={1}>
      <h1 className="font-display text-[32px] font-600 leading-tight tracking-[-0.02em]">Choose a new password</h1>
      <p className="mt-2 text-[15px] text-muted">This link only works once and expires in an hour.</p>

      {formError && (
        <div className="mt-6 rounded-lg border border-danger/25 bg-danger/[0.04] px-4 py-3 text-[14px] text-danger">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
        <TextField
          label="New password" name="password" type="password" value={values.password} onChange={handleChange}
          error={fieldErrors.password} autoComplete="new-password" autoFocus
          hint="At least 8 characters, with a letter and a number."
        />
        <TextField
          label="Confirm new password" name="confirmPassword" type="password" value={values.confirmPassword}
          onChange={handleChange} error={fieldErrors.confirmPassword} autoComplete="new-password"
        />
        <Button type="submit" loading={loading}>Reset password</Button>
      </form>

      <p className="mt-6 text-[14px] text-muted">
        <Link to="/login" className="font-medium text-accent hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
