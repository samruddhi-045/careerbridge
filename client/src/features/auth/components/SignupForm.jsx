import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { parseApiError } from "../api/authApi";
import TextField from "../../../components/ui/TextField";
import Button from "../../../components/ui/Button";

// same form used for both candidate and recruiter signup, role comes in as a prop
export default function SignupForm({ role, heading, subheading, switchTo }) {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({ fullName: "", email: "", password: "" });
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
      await register(role, values);
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
    <>
      <h1 className="font-display text-[32px] font-600 leading-tight tracking-[-0.02em]">{heading}</h1>
      <p className="mt-2 text-[15px] text-muted">{subheading}</p>

      {formError && (
        <div className="mt-6 rounded-lg border border-danger/25 bg-danger/[0.04] px-4 py-3 text-[14px] text-danger">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
        <TextField
          label="Full name" name="fullName" value={values.fullName} onChange={handleChange}
          error={fieldErrors.fullName} autoComplete="name" autoFocus
        />
        <TextField
          label="Work email" name="email" type="email" value={values.email} onChange={handleChange}
          error={fieldErrors.email} autoComplete="email"
        />
        <TextField
          label="Password" name="password" type="password" value={values.password} onChange={handleChange}
          error={fieldErrors.password} autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
        />
        <Button type="submit" loading={loading}>Create account</Button>
      </form>

      <div className="mt-6 space-y-2 text-[14px] text-muted">
        <p>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent hover:underline">Sign in</Link>
        </p>
        <p>
          {switchTo.label}{" "}
          <Link to={switchTo.to} className="font-medium text-accent hover:underline">
            {switchTo.linkText}
          </Link>
        </p>
      </div>
    </>
  );
}