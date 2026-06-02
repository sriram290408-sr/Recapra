import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Bell, LogOut, Menu } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import ProfileAvatar from "./ProfileAvatar";

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadNotifications = async () => {
    try {
      if (!user) {
        setUnreadCount(0);
        return;
      }

      const response = await axiosInstance.get("/notifications");
      setUnreadCount(response.data?.unread_count || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();

    if (!user) return;

    const interval = setInterval(fetchUnreadNotifications, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    setUnreadCount(0);
    navigate("/login");
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    return `/${user.role}/dashboard`;
  };

  const getNotificationLink = () => {
    if (!user) return "/login";
    return `/${user.role}/notifications`;
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex min-w-0 items-center gap-3">
          {user && (
            <button
              type="button"
              onClick={onMenuClick}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
          )}

          <Link
            to={getDashboardLink()}
            className="flex min-w-0 items-center gap-2"
          >
            <img
              src="/logo.png"
              alt="Recapra Logo"
              className="h-9 w-9 shrink-0 rounded-xl object-contain"
            />

            <span className="truncate text-xl font-black tracking-tight text-slate-900">
              Recap<span className="text-indigo-600">ra</span>
            </span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                to={getNotificationLink()}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-blue-100 hover:text-blue-600"
                title="Notifications"
              >
                <Bell size={20} />

                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 sm:flex">
                <ProfileAvatar name={user.name} size={26} />

                <div className="min-w-0">
                  <p className="max-w-[130px] truncate text-xs font-bold leading-4 text-slate-800">
                    {user.name}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                    {user.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-indigo-700"
              >
                Sign In
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-800"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;