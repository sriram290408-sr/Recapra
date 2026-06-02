import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../../components/Toast";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import {
  Bell,
  BellRing,
  Check,
  CheckSquare,
  ArrowLeft,
  ShieldCheck,
  Info,
  ExternalLink,
  BrainCircuit,
} from "lucide-react";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get("/notifications");

      setNotifications(response.data.items || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to fetch notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getDashboardRoute = () => {
    if (!user?.role) return "/login";
    return `/${user.role}/dashboard`;
  };

  const getNotificationRoute = (notification) => {
    const role = user?.role;
    const type = notification?.notification_type;

    // 1. Explicit target_url has highest priority
    if (notification?.target_url) return notification.target_url;

    // 2. Role-based redirection mapping
    if (role === "company") {
      if ((type === "ats" || type === "application" || type === "new_applicant") && notification?.job_id) {
        return `/company/applicants/${notification.job_id}`;
      }
      if (type === "interview") return "/company/interviews";
      if (type === "verification") return "/company/verification";
      if (type === "status_change") return "/company/jobs";
      return "/company/dashboard";
    }

    if (role === "candidate") {
      if (type === "interview") return "/candidate/interviews";
      if (type === "status_change" || type === "application") return "/candidate/applications";
      if (type === "job") {
        if (notification?.job_id) return `/candidate/jobs/${notification.job_id}`;
        return "/candidate/jobs";
      }
      return "/candidate/dashboard";
    }

    if (role === "admin") {
      if (type === "verification") return "/admin/company-verification";
      if (type === "insights" || type === "platform") return "/admin/insights";
      return "/admin/dashboard";
    }

    return getDashboardRoute();
  };

  const handleMarkRead = async (id) => {
    try {
      await axiosInstance.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to update notification.");
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await axiosInstance.put(`/notifications/${notification.id}/read`);
      }

      const route = getNotificationRoute(notification);
      navigate(route);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to open notification.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosInstance.put("/notifications/read-all");

      setToastType("success");
      setToastMsg("All notifications marked as read.");
      fetchNotifications();
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to update notifications.");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not available";

    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeIcon = (type) => {
    if (type === "verification") return ShieldCheck;
    if (type === "status_change") return CheckSquare;
    if (type === "interview") return BellRing;
    if (type === "ats") return BrainCircuit;
    return Info;
  };

  const extractMeetingLink = (message) => {
    if (!message) return null;
    const match = message.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : null;
  };

  if (loading) {
    return <Loader fullPage message="Loading notification center..." />;
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />

        {/* Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-brand-50 via-white to-slate-50 p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
                  <BellRing size={24} />
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                    <Bell size={14} />
                    Notification Center
                  </div>

                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                    Notifications
                  </h2>

                  <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                    View platform updates, application changes, verification
                    alerts, and interview notifications.
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 sm:w-auto"
                  >
                    <CheckSquare size={16} />
                    Mark All Read
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Bell size={18} />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Notification Summary
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {unreadCount} unread notification
                  {unreadCount !== 1 ? "s" : ""} from {notifications.length}{" "}
                  total notification
                  {notifications.length !== 1 ? "s" : ""}.
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit items-center rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
              {unreadCount > 0 ? "Action Needed" : "All Caught Up"}
            </span>
          </div>
        </div>

        {/* Notification List */}
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <EmptyState
              title="No Notifications"
              description="You do not have any notifications right now. Important updates will appear here."
              icon={Bell}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const Icon = getTypeIcon(notification.notification_type);
              const meetingLink = extractMeetingLink(notification.message);

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleNotificationClick(notification);
                    }
                  }}
                  className={`cursor-pointer rounded-2xl border p-5 shadow-sm transition sm:p-6 ${notification.is_read
                      ? "border-slate-200 bg-white hover:bg-slate-50"
                      : "border-brand-200 bg-brand-50/70 hover:bg-brand-50"
                    }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${notification.is_read
                            ? "bg-slate-100 text-slate-500"
                            : "bg-brand-600 text-white"
                          }`}
                      >
                        <Icon size={20} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900">
                            {notification.title}
                          </h4>

                          {!notification.is_read && (
                            <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                              New
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                          {formatDate(notification.created_at)}
                        </p>

                        <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-600">
                          {notification.message}
                        </p>

                        {meetingLink && (
                          <a
                            href={meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={async (e) => {
                              e.stopPropagation();

                              if (!notification.is_read) {
                                await handleMarkRead(notification.id);
                              }
                            }}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700"
                          >
                            Join Meeting
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 lg:justify-end">
                      <StatusBadge status={notification.notification_type} />

                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(notification.id);
                          }}
                          className="inline-flex items-center justify-center rounded-lg border border-brand-200 bg-white p-2 text-brand-600 shadow-sm transition hover:bg-brand-50"
                          title="Mark as read"
                        >
                          <Check size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;