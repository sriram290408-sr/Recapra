import React, { useState, useEffect, useCallback } from "react";
import FileUploadInput from "../../components/FileUploadInput";
import Toast from "../../components/Toast";
import Loader from "../../components/Loader";
import axiosInstance, { ASSET_BASE_URL } from "../../api/axiosInstance";
import {
  Download, Trash2, FileText, Upload, ShieldCheck, BarChart2,
  Zap, Target, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  AlertTriangle, RefreshCw, BookOpen, Star, TrendingUp, Award,
  Briefcase, Layers, Clock, Info,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatSize = (bytes) => {
  if (!bytes) return "Unknown size";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return iso; }
};

const safeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; }
  catch { return typeof val === "string" ? [val] : []; }
};

const scoreColor = (pct) => {
  if (pct >= 75) return "text-emerald-600";
  if (pct >= 50) return "text-amber-500";
  return "text-red-500";
};

const scoreBg = (pct) => {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-400";
  return "bg-red-400";
};

const levelBadge = (level) => {
  const map = {
    Excellent: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Strong: "bg-blue-100 text-blue-700 border-blue-200",
    Good: "bg-indigo-100 text-indigo-700 border-indigo-200",
    "Needs Review": "bg-amber-100 text-amber-700 border-amber-200",
    Weak: "bg-red-100 text-red-700 border-red-200",
  };
  return map[level] || "bg-slate-100 text-slate-700 border-slate-200";
};

const CHART_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#14b8a6"];

// ── Detailed Summary Generator ────────────────────────────────────────────────
const getDetailedSummary = (report) => {
  const score = Math.round(report.overall_score ?? 0);
  const role = report.target_role || "the target role";
  const level = report.match_level || "Needs Review";
  const matched = safeArray(report.matched_skills);
  const missing = safeArray(report.missing_skills);
  const improvements = safeArray(report.improvement_needed);
  const goods = safeArray(report.what_is_good);

  // If the backend summary is already 5+ sentences, use it
  const existingSummary = (report.summary || "").trim();
  if (existingSummary.split(/[.!?]\s+/).filter(Boolean).length >= 5) {
    return existingSummary;
  }

  const lines = [];

  // Line 1: Overall score
  lines.push(`This profile scored ${score}% against the ${role} role requirements.`);

  // Line 2: Match level
  const levelDesc = {
    Excellent: "an Excellent match — the profile is highly aligned with the role demands",
    Strong: "a Strong match — the profile covers most key requirements",
    Good: "a Good match — the profile meets many requirements but has room to grow",
    "Needs Review": "a Needs Review category — several important areas need attention before this profile is competitive",
    Weak: "a Weak match — significant gaps exist between the profile and the role expectations",
  };
  lines.push(`This places the candidate at ${levelDesc[level] || `the ${level} level`}.`);

  // Line 3: Strong areas
  if (goods.length > 0) {
    lines.push(`Strong areas include: ${goods.slice(0, 3).join("; ").replace(/\.$/, "")}.`);
  } else if (matched.length > 0) {
    lines.push(`The candidate demonstrates competency in ${matched.slice(0, 4).join(", ")}.`);
  } else {
    lines.push("No strong skill matches were clearly identified from the current profile data.");
  }

  // Line 4: Missing skills
  if (missing.length > 0) {
    lines.push(`However, important skills such as ${missing.slice(0, 5).join(", ")} are missing or not clearly evidenced in the profile.`);
  } else {
    lines.push("No critical skill gaps were identified — the profile aligns well with the listed requirements.");
  }

  // Line 5: Resume keywords
  const kwScore = report.resume_keyword_score ?? 0;
  if (kwScore >= 12) {
    lines.push("Resume keyword alignment is strong, showing good use of role-specific terminology.");
  } else if (kwScore >= 7) {
    lines.push("The resume shows partial keyword alignment. Adding more role-specific keywords and phrases would strengthen the match.");
  } else {
    lines.push("Resume keyword alignment is weak. The resume should be updated to include more terminology from the job description.");
  }

  // Line 6: Project/portfolio
  const projScore = report.project_score ?? 0;
  const portScore = report.portfolio_score ?? 0;
  if (projScore >= 12 && portScore > 0) {
    lines.push("Project relevance is strong, and the portfolio document provides additional credibility to the profile.");
  } else if (projScore >= 8) {
    lines.push(`Project relevance is moderate. ${portScore > 0 ? "The portfolio document adds value." : "Adding a portfolio document could improve the score by up to 10 points."}`);
  } else {
    lines.push(`Project relevance needs improvement. Consider adding projects that demonstrate skills required for ${role}, with clear tech stacks and descriptions.`);
  }

  // Line 7: Improvement actions
  if (improvements.length > 0) {
    lines.push(`Key areas for improvement: ${improvements.slice(0, 3).join("; ").replace(/\.$/, "")}.`);
  } else {
    lines.push("Continue building relevant skills and updating project portfolios to maintain a competitive profile.");
  }

  // Line 8: Final direction
  if (score >= 75) {
    lines.push(`Overall, this profile is competitive for ${role} positions. Maintain and refine the profile to stay ahead.`);
  } else if (score >= 50) {
    lines.push(`With targeted improvements in the missing areas, this profile can become a strong contender for ${role} roles.`);
  } else {
    lines.push(`This profile needs significant strengthening before applying to ${role} positions. Focus on bridging skill gaps and enriching project experience.`);
  }

  return lines.join("\n");
};

// ── Collapsible Section ───────────────────────────────────────────────────────
const CollapsibleSection = ({ title, icon: Icon, iconColor, isOpen, onToggle, borderColor, bgColor, children }) => (
  <div className={`rounded-2xl border ${borderColor || "border-slate-200"} ${bgColor || "bg-white"} shadow-sm overflow-hidden transition-all`}>
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50/60"
    >
      <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        {Icon && <Icon size={15} className={iconColor || "text-indigo-500"} />} {title}
      </h4>
      {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
    </button>
    {isOpen && <div className="px-5 pb-5">{children}</div>}
  </div>
);

// ── Score Bar ─────────────────────────────────────────────────────────────────
const ScoreBar = ({ label, score, max, color }) => {
  const pct = Math.min((score / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>{label}</span>
        <span className="font-bold">{score.toFixed(1)} / {max}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ── Document Card ─────────────────────────────────────────────────────────────
const DocumentCard = ({ doc, label, color, onDelete }) => (
  <div className={`rounded-2xl border ${color} bg-white p-5 shadow-sm`}>
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <FileText size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-700">
          {label}
        </span>
        <h4 className="mt-2 truncate text-sm font-bold text-slate-900" title={doc.original_file_name}>
          {doc.original_file_name}
        </h4>
        <p className="mt-0.5 text-xs text-slate-400">
          {formatSize(doc.file_size)} · Uploaded {formatDate(doc.uploaded_at)}
        </p>
      </div>
    </div>
    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
      <a
        href={`${ASSET_BASE_URL}/${doc.file_path}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
      >
        <Download size={13} /> View / Download
      </a>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
      >
        <Trash2 size={13} /> Remove
      </button>
    </div>
  </div>
);

// ── Upload Panel ──────────────────────────────────────────────────────────────
const UploadPanel = ({ docType, label, onSuccess, existing }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError("Select a file first."); return; }
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("document_type", docType);
      fd.append("file", file);
      await axiosInstance.post("/candidate/documents", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setFile(null);
      onSuccess(`${label} uploaded and replaced successfully!`);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</div>
      )}
      <FileUploadInput
        id={`upload_${docType}`}
        accept={docType === "resume" ? ".pdf,.doc,.docx" : ".pdf"}
        onChange={(f) => { setFile(f); setError(""); }}
        helperText={docType === "resume" ? "PDF, DOC, DOCX · Max 5 MB" : "PDF only · Max 5 MB"}
      />
      <button
        type="submit"
        disabled={uploading || !file}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload size={14} />
        {uploading ? "Uploading…" : `${existing ? "Replace" : "Upload"} ${label}`}
      </button>
    </form>
  );
};

// ── ATS Report Display ────────────────────────────────────────────────────────
const ATSReport = ({ report }) => {
  const score = report.overall_score ?? 0;
  const chartData = [
    { name: "Skills", value: report.skills_score ?? 0, max: 35 },
    { name: "Experience", value: report.experience_score ?? 0, max: 15 },
    { name: "Projects", value: report.project_score ?? 0, max: 15 },
    { name: "Keywords", value: report.resume_keyword_score ?? 0, max: 15 },
    { name: "Portfolio", value: report.portfolio_score ?? 0, max: 10 },
    { name: "Education", value: report.education_score ?? 0, max: 10 },
  ];

  // Section open state — default: overview, summary, missing, improvements open
  const [sections, setSections] = useState({
    overview: true,
    summary: true,
    breakdown: false,
    good: false,
    missing: true,
    improvements: true,
    skills: false,
    trend: false,
  });

  const toggleSection = (key) => setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const expandAll = () => setSections(Object.fromEntries(Object.keys(sections).map((k) => [k, true])));
  const collapseAll = () => setSections(Object.fromEntries(Object.keys(sections).map((k) => [k, false])));

  const detailedSummary = getDetailedSummary(report);

  return (
    <div className="space-y-4">
      {/* Expand / Collapse All */}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={expandAll} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50">
          <ChevronDown size={12} /> Expand All
        </button>
        <button type="button" onClick={collapseAll} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50">
          <ChevronUp size={12} /> Collapse All
        </button>
      </div>

      {/* 1. Score Overview */}
      <CollapsibleSection title="Score Overview" icon={Award} iconColor="text-indigo-500" isOpen={sections.overview} onToggle={() => toggleSection("overview")} borderColor="border-indigo-100" bgColor="bg-gradient-to-br from-indigo-50 via-white to-slate-50">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-indigo-100 bg-white shadow-sm">
            <div className="text-center">
              <p className={`text-3xl font-black ${scoreColor(score)}`}>{Math.round(score)}%</p>
              <p className="text-[10px] font-bold uppercase text-slate-400">Match</p>
            </div>
          </div>
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">ATS Match Result</p>
            <h3 className="text-xl font-black text-slate-900">{report.target_role}</h3>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${levelBadge(report.match_level)}`}>
                <Award size={11} /> {report.match_level}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                <Target size={11} /> Confidence: {report.confidence_level}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                <Clock size={11} /> Run #{report.run_count} · {formatDate(report.last_run_at)}
              </span>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* 2. Summary — 7-8 lines */}
      <CollapsibleSection title="Summary" icon={BookOpen} iconColor="text-indigo-500" isOpen={sections.summary} onToggle={() => toggleSection("summary")}>
        <div className="space-y-2">
          {detailedSummary.split("\n").map((line, i) => (
            <p key={i} className="text-sm font-medium leading-relaxed text-slate-600">{line}</p>
          ))}
        </div>
      </CollapsibleSection>

      {/* 3. Score Breakdown & Distribution */}
      <CollapsibleSection title="Score Breakdown & Distribution" icon={Layers} iconColor="text-indigo-500" isOpen={sections.breakdown} onToggle={() => toggleSection("breakdown")}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <ScoreBar label="Skills Match" score={report.skills_score ?? 0} max={35} color="bg-indigo-500" />
            <ScoreBar label="Experience Match" score={report.experience_score ?? 0} max={15} color="bg-blue-500" />
            <ScoreBar label="Project Relevance" score={report.project_score ?? 0} max={15} color="bg-purple-500" />
            <ScoreBar label="Resume Keywords" score={report.resume_keyword_score ?? 0} max={15} color="bg-amber-500" />
            <ScoreBar label="Portfolio" score={report.portfolio_score ?? 0} max={10} color="bg-emerald-500" />
            <ScoreBar label="Education" score={report.education_score ?? 0} max={10} color="bg-teal-500" />
          </div>
          <div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {chartData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(val) => `${val.toFixed(1)} pts`} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CollapsibleSection>

      {/* 4. What's Working Well */}
      {safeArray(report.what_is_good).length > 0 && (
        <CollapsibleSection title="What's Working Well" icon={CheckCircle2} iconColor="text-emerald-600" isOpen={sections.good} onToggle={() => toggleSection("good")} borderColor="border-emerald-200" bgColor="bg-emerald-50">
          <ul className="space-y-2">
            {safeArray(report.what_is_good).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={11} className="mt-0.5 shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* 5. What's Missing */}
      {safeArray(report.what_is_missing).length > 0 && (
        <CollapsibleSection title="What's Missing" icon={XCircle} iconColor="text-red-600" isOpen={sections.missing} onToggle={() => toggleSection("missing")} borderColor="border-red-200" bgColor="bg-red-50">
          <ul className="space-y-2">
            {safeArray(report.what_is_missing).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs font-semibold text-red-700">
                <XCircle size={11} className="mt-0.5 shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* 6. Improvements Needed */}
      {safeArray(report.improvement_needed).length > 0 && (
        <CollapsibleSection title="Improvements Needed" icon={TrendingUp} iconColor="text-amber-600" isOpen={sections.improvements} onToggle={() => toggleSection("improvements")} borderColor="border-amber-200" bgColor="bg-amber-50">
          <ul className="space-y-2">
            {safeArray(report.improvement_needed).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs font-semibold text-amber-700">
                <Star size={11} className="mt-0.5 shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* 7. Skills & Keywords */}
      <CollapsibleSection title="Skills & Keywords" icon={Zap} iconColor="text-indigo-500" isOpen={sections.skills} onToggle={() => toggleSection("skills")}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <h5 className="mb-2 text-xs font-bold text-slate-700">Matched Skills</h5>
              <div className="flex flex-wrap gap-1.5">
                {safeArray(report.matched_skills).length > 0
                  ? safeArray(report.matched_skills).map((s, i) => (
                      <span key={i} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">✓ {s}</span>
                    ))
                  : <p className="text-xs text-slate-400">No matched skills detected.</p>}
              </div>
            </div>
            <div>
              <h5 className="mb-2 text-xs font-bold text-slate-700">Missing Skills</h5>
              <div className="flex flex-wrap gap-1.5">
                {safeArray(report.missing_skills).length > 0
                  ? safeArray(report.missing_skills).map((s, i) => (
                      <span key={i} className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">✗ {s}</span>
                    ))
                  : <p className="text-xs text-slate-400">No critical skill gaps found.</p>}
              </div>
            </div>
          </div>
          {(report.feedback_summary || report.resume_analysis || report.portfolio_analysis) && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {report.feedback_summary && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <h5 className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700"><Zap size={12} className="text-indigo-500" /> Feedback</h5>
                  <p className="text-xs font-medium leading-relaxed text-slate-600">{report.feedback_summary}</p>
                </div>
              )}
              {report.resume_analysis && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <h5 className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700"><FileText size={12} className="text-brand-500" /> Resume Notes</h5>
                  <p className="text-xs font-medium leading-relaxed text-slate-600">{report.resume_analysis}</p>
                </div>
              )}
              {report.portfolio_analysis && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <h5 className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700"><Briefcase size={12} className="text-brand-500" /> Portfolio Notes</h5>
                  <p className="text-xs font-medium leading-relaxed text-slate-600">{report.portfolio_analysis}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* 8. Trend & Recommendation */}
      {(report.trend_analysis || report.recommendation) && (
        <CollapsibleSection title="Trend & Recommendation" icon={TrendingUp} iconColor="text-indigo-500" isOpen={sections.trend} onToggle={() => toggleSection("trend")} borderColor="border-indigo-200" bgColor="bg-indigo-50">
          <div className="space-y-4">
            {report.trend_analysis && (
              <div>
                <h5 className="mb-1 text-xs font-bold text-indigo-800">Trend Analysis</h5>
                <p className="text-xs font-medium leading-relaxed text-indigo-700">{report.trend_analysis}</p>
              </div>
            )}
            {report.recommendation && (
              <div>
                <h5 className="mb-1 text-xs font-bold text-indigo-800">Recommendation</h5>
                <p className="text-xs font-semibold leading-relaxed text-indigo-700">{report.recommendation}</p>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Source Note */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-2">
        <Info size={13} className="shrink-0 text-slate-400" />
        <p className="text-[11px] font-semibold text-slate-400">
          Report generated by: <span className="font-black text-slate-600">
            {report.generated_by === "hf_ai" ? "Hugging Face AI" : "In-House Engine"}
          </span>
          {" · "}Source: <span className="font-black text-slate-600">
            {report.source_type === "role_template" ? "Role JD Template" : "Company Job JD"}
          </span>
        </p>
      </div>
    </div>
  );
};

// ── Main Page Component ───────────────────────────────────────────────────────
const CandidateDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  // ATS state
  const [analysisType, setAnalysisType] = useState("role_template");
  const [roleTemplates, setRoleTemplates] = useState([]);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [pastReports, setPastReports] = useState([]);
  const [showPastReports, setShowPastReports] = useState(false);
  const [latestReportOpen, setLatestReportOpen] = useState(true);
  const [expandedPastId, setExpandedPastId] = useState(null);

  // Derived
  const resume = documents.find((d) => d.document_type === "resume");
  const portfolio = documents.find((d) => d.document_type === "portfolio");

  const fetchDocuments = useCallback(async () => {
    try {
      const r = await axiosInstance.get("/candidate/documents");
      setDocuments(r.data || []);
    } catch {
      showToast("error", "Failed to load documents.");
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const r = await axiosInstance.get("/candidate/ats/role-templates");
      const sorted = (r.data || []).slice().sort((a, b) => a.role_name.localeCompare(b.role_name));
      setRoleTemplates(sorted);
      if (sorted.length) setSelectedTemplateId(sorted[0].id);
    } catch { /* silent */ }
  }, []);

  const fetchCompanyJobs = useCallback(async () => {
    try {
      const r = await axiosInstance.get("/candidate/ats/company-jobs");
      setCompanyJobs(r.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchPastReports = useCallback(async () => {
    try {
      const r = await axiosInstance.get("/candidate/ats/reports");
      const reports = r.data || [];
      setPastReports(reports);
      if (reports.length && !currentReport) setCurrentReport(reports[0]);
    } catch { /* silent */ }
  }, [currentReport]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDocuments(), fetchTemplates(), fetchCompanyJobs(), fetchPastReports()]);
      setLoading(false);
    };
    init();
  }, []);

  const showToast = (type, msg) => { setToastType(type); setToastMsg(msg); };

  const handleDocSuccess = async (msg) => {
    showToast("success", msg);
    await fetchDocuments();
    await fetchPastReports();
  };

  const handleDelete = async (id, type) => {
    try {
      await axiosInstance.delete(`/candidate/documents/${id}`);
      showToast("success", `${type} removed.`);
      await fetchDocuments();
    } catch {
      showToast("error", "Failed to remove document.");
    }
  };

  const handleRunAnalysis = async () => {
    if (!resume) { showToast("error", "Please upload a resume before running analysis."); return; }
    if (analysisType === "role_template" && !selectedTemplateId) {
      showToast("error", "Please select a role template."); return;
    }
    if (analysisType === "company_job" && !selectedJobId) {
      showToast("error", "Please select a company job."); return;
    }
    setAnalyzing(true);
    try {
      const payload = {
        analysis_type: analysisType,
        role_template_id: analysisType === "role_template" ? parseInt(selectedTemplateId) : null,
        job_id: analysisType === "company_job" ? parseInt(selectedJobId) : null,
      };
      const r = await axiosInstance.post("/candidate/ats/analyze", payload);
      setCurrentReport(r.data);
      setLatestReportOpen(true);
      await fetchPastReports();
      showToast("success", "ATS analysis complete! Report saved.");
      // Scroll to report
      setTimeout(() => document.getElementById("ats-report-section")?.scrollIntoView({ behavior: "smooth" }), 300);
    } catch (err) {
      showToast("error", err.response?.data?.detail || "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <Loader fullPage message="Loading Resume & Portfolio Vault…" />;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg("")} />

        {/* ── Page Header ── */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Resume &amp; Portfolio Vault</h2>
              <p className="mt-1 max-w-3xl text-sm font-medium text-slate-500">
                Upload your resume and portfolio, then run a personalised ATS analysis to see how you match against role requirements.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <ShieldCheck size={14} /> Stored securely in your candidate document vault
              </div>
            </div>
          </div>
        </div>

        {/* ── Documents Row ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Resume */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
              <FileText size={15} className="text-brand-500" /> Resume / CV
            </h3>
            {resume ? (
              <DocumentCard
                doc={resume}
                label="Resume / CV"
                color="border-brand-100"
                onDelete={() => handleDelete(resume.id, "Resume")}
              />
            ) : (
              <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                <p className="text-xs font-semibold text-slate-400">No resume uploaded yet.</p>
              </div>
            )}
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                {resume ? "Replace Resume" : "Upload Resume"}
              </p>
              <UploadPanel docType="resume" label="Resume" onSuccess={handleDocSuccess} existing={!!resume} />
            </div>
          </div>

          {/* Portfolio */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Briefcase size={15} className="text-brand-500" /> Portfolio PDF
            </h3>
            {portfolio ? (
              <DocumentCard
                doc={portfolio}
                label="Portfolio"
                color="border-purple-100"
                onDelete={() => handleDelete(portfolio.id, "Portfolio")}
              />
            ) : (
              <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                <p className="text-xs font-semibold text-slate-400">No portfolio uploaded. Optional but adds +10 pts to ATS score.</p>
              </div>
            )}
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                {portfolio ? "Replace Portfolio" : "Upload Portfolio"}
              </p>
              <UploadPanel docType="portfolio" label="Portfolio" onSuccess={handleDocSuccess} existing={!!portfolio} />
            </div>
          </div>
        </div>

        {/* ── ATS Analysis Panel ── */}
        <div className="rounded-2xl border border-indigo-200 bg-white shadow-sm">
          <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-white px-5 py-4 sm:px-6">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <BarChart2 size={18} className="text-indigo-500" /> ATS Profile Analysis
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Analyse your profile against a target role or a real company job description.
            </p>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {!resume && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                <AlertTriangle size={15} /> Upload your resume first to enable ATS analysis.
              </div>
            )}

            {/* Analysis Type Toggle */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Analysis Source
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                {[
                  { value: "role_template", label: "Role JD Template", icon: Target },
                  { value: "company_job", label: "Company Job JD", icon: Briefcase },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAnalysisType(value)}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                      analysisType === value
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector */}
            {analysisType === "role_template" ? (
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Target Role
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {roleTemplates.length === 0 && <option value="">Loading templates…</option>}
                  {roleTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.role_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Company Job Posting
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">— Select a job —</option>
                  {companyJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}{j.location ? ` · ${j.location}` : ""}{j.work_mode ? ` (${j.work_mode})` : ""}
                    </option>
                  ))}
                </select>
                {companyJobs.length === 0 && (
                  <p className="mt-2 text-xs text-slate-400">No active company jobs found.</p>
                )}
              </div>
            )}

            {/* Run Button */}
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={analyzing || !resume}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing ? (
                <><RefreshCw size={15} className="animate-spin" /> Analysing Profile…</>
              ) : (
                <><Zap size={15} /> Run ATS Analysis</>
              )}
            </button>
          </div>
        </div>

        {/* ── Current Report ── */}
        {currentReport && (
          <div id="ats-report-section" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setLatestReportOpen((v) => !v)}
              className="flex w-full items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4 text-left transition hover:bg-slate-100 sm:px-6"
            >
              <div className="flex items-center gap-3">
                <Star size={16} className="text-indigo-500 shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Latest ATS Report — {currentReport.target_role}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${levelBadge(currentReport.match_level)}`}>
                      {currentReport.match_level}
                    </span>
                    <span className={`text-sm font-black ${scoreColor(currentReport.overall_score)}`}>
                      {Math.round(currentReport.overall_score)}%
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Run #{currentReport.run_count} · {formatDate(currentReport.last_run_at)}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      · {currentReport.generated_by === "hf_ai" ? "AI Report" : "In-House"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!latestReportOpen && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-600">
                    View Details
                  </span>
                )}
                {latestReportOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </button>
            {latestReportOpen && (
              <div className="p-5 sm:p-6">
                <ATSReport report={currentReport} />
              </div>
            )}
          </div>
        )}

        {/* ── Past Reports Accordion ── */}
        {pastReports.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setShowPastReports((v) => !v)}
              className="flex w-full items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4 text-left transition hover:bg-slate-100 sm:px-6"
            >
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <BookOpen size={15} className="text-slate-400" /> Saved ATS Reports
                  <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-black text-indigo-600">
                    {pastReports.length}
                  </span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">Your previous analysis results — click to expand.</p>
              </div>
              {showPastReports ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>

            {showPastReports && (
              <div className="divide-y divide-slate-100">
                {pastReports.map((r) => (
                  <div key={r.id} className="px-5 py-4 sm:px-6">
                    <button
                      type="button"
                      onClick={() => setExpandedPastId(expandedPastId === r.id ? null : r.id)}
                      className="flex w-full items-center justify-between text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white ${scoreBg(r.overall_score)}`}>
                          {Math.round(r.overall_score)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition">{r.target_role}</p>
                          <p className="text-xs text-slate-400">
                            {r.source_type === "role_template" ? "Role Template" : "Company JD"} · {formatDate(r.last_run_at)} · Run #{r.run_count}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${levelBadge(r.match_level)}`}>
                          {r.match_level}
                        </span>
                        {expandedPastId === r.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </div>
                    </button>
                    {expandedPastId === r.id && (
                      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                        <ATSReport report={r} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDocuments;