import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardCard from "../../components/DashboardCard";
import Loader from "../../components/Loader";
import Toast from "../../components/Toast";
import axiosInstance from "../../api/axiosInstance";
import {
  Users,
  FileCheck,
  ShieldAlert,
  Briefcase,
  Send,
  BarChart2,
  Building2,
  ShieldCheck,
  ArrowRight,
  Activity,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/admin/dashboard");
      setStats(response.data);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to load administrator statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return <Loader fullPage message="Accessing administrative database..." />;
  }

  const pendingCount = stats?.pending_verifications || 0;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />

        {/* Main Header Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-brand-50 via-white to-slate-50 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
                <BarChart2 size={24} />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                  <ShieldCheck size={14} />
                  Admin Control Center
                </div>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                  Administrator Core Dashboard
                </h2>

                <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                  Monitor platform statistics, review company verification
                  status, and track jobs, applications, and user activity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {stats && (
          <>
            {/* Priority Alert */}
            {pendingCount > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                      <ShieldAlert size={22} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-amber-950">
                        Verification audits need review
                      </h3>

                      <p className="mt-1 text-sm font-medium leading-6 text-amber-800">
                        There are {pendingCount} company verification request
                        {pendingCount !== 1 ? "s" : ""} waiting for admin
                        approval or rejection.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/admin/company-verification")}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700 sm:w-auto"
                  >
                    Review Now
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              <DashboardCard
                title="Total Registered Candidates"
                value={(stats.total_candidates || 0).toString()}
                subtext="Talents in career rebuilding pathway"
                icon={Users}
                variant="indigo"
              />

              <DashboardCard
                title="Total Organizations"
                value={(stats.total_companies || 0).toString()}
                subtext="Registered employers and recruiters"
                icon={Building2}
                variant="info"
              />

              <DashboardCard
                title="Pending Verification Audits"
                value={(stats.pending_verifications || 0).toString()}
                subtext="Company documents awaiting review"
                icon={FileCheck}
                variant={pendingCount > 0 ? "pending" : "neutral"}
                onClick={() => navigate("/admin/company-verification")}
              />

              <DashboardCard
                title="Approved Vetted Companies"
                value={(stats.approved_companies || 0).toString()}
                subtext="Verified hiring organizations"
                icon={ShieldCheck}
                variant="success"
              />

              <DashboardCard
                title="Rejected Organizations"
                value={(stats.rejected_companies || 0).toString()}
                subtext="Invalid or rejected verification documents"
                icon={ShieldAlert}
                variant="rejected"
              />

              <DashboardCard
                title="Total Jobs Posted"
                value={(stats.total_jobs || 0).toString()}
                subtext="Active and paused role listings"
                icon={Briefcase}
                variant="indigo"
              />

              <DashboardCard
                title="Total Applications Placed"
                value={(stats.total_applications || 0).toString()}
                subtext="Candidate applications across jobs"
                icon={Send}
                variant="indigo"
              />

              <DashboardCard
                title="Platform Activity"
                value="Live"
                subtext="Admin monitoring enabled"
                icon={Activity}
                variant="info"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;