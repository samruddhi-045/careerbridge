import { useEffect, useState } from "react";
import AppHeader from "../../layouts/AppHeader";
import TextField from "../../components/ui/TextField";
import TextArea from "../../components/ui/TextArea";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { parseApiError } from "../../features/auth/api/authApi";
import {
  createCompanyRequest,
  joinCompanyRequest,
  searchCompaniesRequest,
  getMyCompanyRequest,
  updateCompanyRequest,
} from "../../features/company/api/companyApi";

const SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

const emptyCompanyForm = {
  name: "",
  website: "",
  industry: "",
  size: "1-10",
  description: "",
  logoUrl: "",
  location: { city: "", country: "" },
  socials: { linkedin: "", twitter: "" },
};

function CreateOrJoinCompany({ onDone }) {
  const [tab, setTab] = useState("create"); // create | join
  const [form, setForm] = useState(emptyCompanyForm);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setNested = (group, key, value) => setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    try {
      const res = await searchCompaniesRequest(query);
      setResults(res.data.companies);
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async (companyId) => {
    setSaving(true);
    setError("");
    try {
      const res = await joinCompanyRequest(companyId);
      onDone(res.data);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await createCompanyRequest(form);
      onDone(res.data);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mt-6 flex gap-2 rounded-lg border border-line bg-white p-1 text-[14px] font-medium">
        <button
          type="button"
          onClick={() => setTab("create")}
          className={`flex-1 rounded-md py-2 transition-colors ${tab === "create" ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
        >
          Create a company
        </button>
        <button
          type="button"
          onClick={() => setTab("join")}
          className={`flex-1 rounded-md py-2 transition-colors ${tab === "join" ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
        >
          Join existing company
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-danger/25 bg-danger/[0.04] px-4 py-3 text-[14px] text-danger">{error}</div>
      )}

      {tab === "create" ? (
        <form onSubmit={handleCreate} className="mt-6 space-y-5">
          <TextField label="Company name" name="name" value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Website" name="website" value={form.website} onChange={(e) => set("website", e.target.value)} hint="https://…" />
            <TextField label="Industry" name="industry" value={form.industry} onChange={(e) => set("industry", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Company size</label>
            <select
              value={form.size}
              onChange={(e) => set("size", e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s} employees</option>)}
            </select>
          </div>
          <TextArea label="Description" name="description" value={form.description} onChange={(e) => set("description", e.target.value)} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="City" name="city" value={form.location.city} onChange={(e) => setNested("location", "city", e.target.value)} />
            <TextField label="Country" name="country" value={form.location.country} onChange={(e) => setNested("location", "country", e.target.value)} />
          </div>
          <Button type="submit" loading={saving}>Create company</Button>
        </form>
      ) : (
        <div className="mt-6">
          <form onSubmit={handleSearch} className="flex items-end gap-3">
            <div className="flex-1">
              <TextField label="Search by name" name="query" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="h-[46px] shrink-0 rounded-lg border border-line bg-white px-5 text-[15px] font-medium text-ink hover:border-ink/30 transition-colors disabled:opacity-60"
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </form>

          <ul className="mt-5 space-y-2">
            {results.map((c) => (
              <li key={c._id} className="flex items-center justify-between rounded-lg border border-line px-4 py-3">
                <div>
                  <p className="text-[15px] font-medium">{c.name}</p>
                  <p className="text-[13px] text-muted">{[c.industry, c.location?.city].filter(Boolean).join(" · ") || "—"}</p>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleJoin(c._id)}
                  className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-medium hover:border-ink/30 transition-colors disabled:opacity-60"
                >
                  Join
                </button>
              </li>
            ))}
            {results.length === 0 && query && !searching && (
              <p className="text-[14px] text-muted">No companies matched "{query}".</p>
            )}
          </ul>
        </div>
      )}
    </>
  );
}

function CompanyDetails({ company, canEdit, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(company);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setNested = (group, key, value) => setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await updateCompanyRequest(company._id, form);
      onSave(res.data.company);
      setEditing(false);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="mt-6 space-y-6">
        <div className="rounded-xl border border-line bg-white p-6">
          <h2 className="font-display text-[22px] font-600">{company.name}</h2>
          <p className="mt-1 text-[14px] text-muted">
            {[company.industry, company.size && `${company.size} employees`, company.location?.city].filter(Boolean).join(" · ") || "No details yet"}
          </p>
          {company.description && <p className="mt-4 text-[15px] text-ink">{company.description}</p>}
          {company.website && (
            <a href={company.website} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[14px] font-medium text-accent hover:underline">
              {company.website}
            </a>
          )}
        </div>
        {canEdit && (
          <Button type="button" variant="ghost" onClick={() => { setForm(company); setEditing(true); }}>
            Edit company details
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="mt-6 space-y-5">
      {error && (
        <div className="rounded-lg border border-danger/25 bg-danger/[0.04] px-4 py-3 text-[14px] text-danger">{error}</div>
      )}
      <TextField label="Company name" name="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Website" name="website" value={form.website} onChange={(e) => set("website", e.target.value)} />
        <TextField label="Industry" name="industry" value={form.industry} onChange={(e) => set("industry", e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium text-ink">Company size</label>
        <select
          value={form.size}
          onChange={(e) => set("size", e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s} employees</option>)}
        </select>
      </div>
      <TextArea label="Description" name="description" value={form.description} onChange={(e) => set("description", e.target.value)} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="City" name="city" value={form.location?.city || ""} onChange={(e) => setNested("location", "city", e.target.value)} />
        <TextField label="Country" name="country" value={form.location?.country || ""} onChange={(e) => setNested("location", "country", e.target.value)} />
      </div>
      <div className="flex gap-3">
        <Button type="submit" loading={saving}>Save changes</Button>
        <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </form>
  );
}

export default function Company() {
  const { user, updateUser } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }
    getMyCompanyRequest()
      .then((res) => setCompany(res.data.company))
      .finally(() => setLoading(false));
  }, [user?.companyId]);

  const handleOnboarded = ({ company: newCompany, user: updatedUser }) => {
    setCompany(newCompany);
    updateUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-2xl px-6 py-14 rise">
        <p className="eyebrow text-muted">Company</p>
        <h1 className="mt-3 font-display text-[32px] font-600 leading-tight tracking-[-0.02em]">
          {company ? company.name : "Set up your company"}
        </h1>
        {!company && (
          <p className="mt-2 text-[15px] text-muted">Create a new company or join one your teammate already added.</p>
        )}

        {company ? (
          <CompanyDetails company={company} canEdit={user.role === "company_admin"} onSave={setCompany} />
        ) : (
          <CreateOrJoinCompany onDone={handleOnboarded} />
        )}
      </main>
    </div>
  );
}
