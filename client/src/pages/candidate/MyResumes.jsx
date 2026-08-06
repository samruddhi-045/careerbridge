import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../../layouts/AppHeader";
import Button from "../../components/ui/Button";
import TextField from "../../components/ui/TextField";
import { parseApiError } from "../../features/auth/api/authApi";
import {
  listResumesRequest,
  createResumeRequest,
  updateResumeRequest,
  deleteResumeRequest,
  duplicateResumeRequest,
} from "../../features/resume/api/resumeApi";

// "Edited 2 hours ago" reads better than a raw timestamp on a list of drafts.
const relativeTime = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
};

export default function MyResumes() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // create form
  const [name, setName] = useState("");
  const [prefill, setPrefill] = useState(true);
  const [nameError, setNameError] = useState("");
  const [creating, setCreating] = useState(false);

  // per-card transient state, keyed by resume id, so a spinner or a confirm
  // prompt on one card never affects another
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await listResumesRequest();
      setResumes(res.data.resumes);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setNameError("");
    setError("");
    setCreating(true);
    try {
      await createResumeRequest({ name, prefillFromProfile: prefill });
      setName("");
      await load();
    } catch (err) {
      const parsed = parseApiError(err);
      // 400s come back with per-field details; 409 (resume cap) does not
      if (parsed.fieldErrors.name) setNameError(parsed.fieldErrors.name);
      else setError(parsed.message);
    } finally {
      setCreating(false);
    }
  };

  const runAction = async (id, action) => {
    setBusyId(id);
    setError("");
    try {
      await action();
      await load();
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setBusyId(null);
      setConfirmId(null);
      setRenamingId(null);
    }
  };

  const handleRenameSubmit = (id) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    runAction(id, () => updateResumeRequest(id, { name: trimmed }));
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-6 py-12 rise">
        <p className="eyebrow text-muted">Resumes</p>
        <h1 className="mt-3 font-display text-[34px] font-600 leading-tight tracking-[-0.02em]">
          My resumes
        </h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted">
          Keep a separate resume for each kind of role you apply to. Content is stored as
          structured data, so you can restyle or export it any time.
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-danger/25 bg-danger/[0.04] px-4 py-3 text-[14px] text-danger">
            {error}
          </div>
        )}

        {/* Create */}
        <form
          onSubmit={handleCreate}
          className="mt-8 rounded-xl border border-line bg-white p-5 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <TextField
                label="New resume name"
                name="resumeName"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError("");
                }}
                error={nameError}
                hint='Name it after the roles it targets, e.g. "Frontend — product companies".'
              />
            </div>
            <div className="sm:w-40 sm:pt-[26px]">
              <Button type="submit" loading={creating}>
                Create resume
              </Button>
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[14px] text-muted">
            <input
              type="checkbox"
              checked={prefill}
              onChange={(e) => setPrefill(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line accent-accent"
            />
            <span>
              Start from my profile
              <span className="block text-[13px] text-muted/80">
                Copies your contact details, experience, education and skills. You can edit
                everything afterwards without changing your profile.
              </span>
            </span>
          </label>
        </form>

        {/* List */}
        <div className="mt-10">
          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-[74px] animate-pulse rounded-xl border border-line bg-white" />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-white/50 px-6 py-14 text-center">
              <p className="font-display text-[19px] font-600">No resumes yet</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[14px] text-muted">
                Create your first one above. Starting from your profile is the fastest way in.
              </p>
            </div>
          ) : (
            <>
              <p className="eyebrow mb-3 text-muted">
                {resumes.length} {resumes.length === 1 ? "resume" : "resumes"}
              </p>
              <ul className="space-y-3">
                {resumes.map((resume) => {
                  const isBusy = busyId === resume.id;

                  return (
                    <li
                      key={resume.id}
                      className="rounded-xl border border-line bg-white px-5 py-4 transition-colors hover:border-ink/20"
                    >
                      {renamingId === resume.id ? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameSubmit(resume.id);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            className="flex-1 rounded-lg border border-accent bg-white px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRenameSubmit(resume.id)}
                              disabled={isBusy}
                              className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
                            >
                              Save name
                            </button>
                            <button
                              onClick={() => setRenamingId(null)}
                              className="rounded-lg border border-line px-3.5 py-2 text-sm font-medium hover:border-ink/30"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-[16px] font-medium">{resume.name}</p>
                            <p className="mt-0.5 text-[13px] text-muted">
                              {resume.templateId} template · edited {relativeTime(resume.updatedAt)}
                            </p>
                          </div>

                          {confirmId === resume.id ? (
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-[13px] text-muted">Delete permanently?</span>
                              <button
                                onClick={() =>
                                  runAction(resume.id, () => deleteResumeRequest(resume.id))
                                }
                                disabled={isBusy}
                                className="rounded-lg bg-danger px-3 py-1.5 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-60"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:border-ink/30"
                              >
                                Keep
                              </button>
                            </div>
                          ) : (
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              <Link
                                to={`/candidate/resumes/${resume.id}`}
                                className="rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => {
                                  setRenamingId(resume.id);
                                  setRenameValue(resume.name);
                                }}
                                disabled={isBusy}
                                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:border-ink/30 disabled:opacity-60"
                              >
                                Rename
                              </button>
                              <button
                                onClick={() =>
                                  runAction(resume.id, () => duplicateResumeRequest(resume.id))
                                }
                                disabled={isBusy}
                                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:border-ink/30 disabled:opacity-60"
                              >
                                Duplicate
                              </button>
                              <button
                                onClick={() => setConfirmId(resume.id)}
                                disabled={isBusy}
                                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-danger hover:border-danger/40 disabled:opacity-60"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </main>
    </div>
  );
}