import { useEffect, useState } from "react";
import { parseApiError } from "../../auth/api/authApi";
import { getInviteCodeRequest, regenerateInviteCodeRequest } from "../api/companyApi";

/**
 * Shown only to a company_admin. The code is how teammates join -- there is no
 * longer any way in without it, so this card is the whole invite mechanism.
 */
export default function InviteCodeCard() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    getInviteCodeRequest()
      .then((res) => setCode(res.data.inviteCode))
      .catch((err) => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — select the code and copy it manually.");
    }
  };

  const regenerate = async () => {
    setWorking(true);
    setError("");
    try {
      const res = await regenerateInviteCodeRequest();
      setCode(res.data.inviteCode);
      setConfirming(false);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-white p-6">
      <h3 className="font-display text-[17px] font-600">Invite your team</h3>
      <p className="mt-1 text-[14px] text-muted">
        Recruiters need this code to join. Share it privately — anyone who has it can join
        this company.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-danger/25 bg-danger/[0.04] px-3.5 py-2.5 text-[13px] text-danger">
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="flex-1 select-all rounded-lg border border-line bg-paper px-4 py-3 font-mono text-[15px] tracking-[0.12em]">
          {loading ? "…" : code || "—"}
        </code>
        <button
          type="button"
          onClick={copy}
          disabled={loading || !code}
          className="shrink-0 rounded-lg bg-ink px-4 py-3 text-[14px] font-medium text-white transition-colors hover:bg-ink/90 disabled:opacity-50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {confirming ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-muted">Generate a new code? The current one stops working.</span>
          <button
            type="button"
            onClick={regenerate}
            disabled={working}
            className="rounded-lg bg-danger px-3 py-1.5 font-medium text-white hover:bg-danger/90 disabled:opacity-60"
          >
            {working ? "Working…" : "Regenerate"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg border border-line px-3 py-1.5 font-medium hover:border-ink/30"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={loading}
          className="mt-3 text-[13px] font-medium text-accent hover:underline disabled:opacity-50"
        >
          Regenerate code
        </button>
      )}
    </div>
  );
}