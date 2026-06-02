import React, { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, User, GraduationCap, Code, Briefcase,
  FileText, Award, Search, FileCheck, CheckSquare, PlusCircle, Bell, Calendar, BarChart3
} from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Close sidebar on route change (crucial for mobile drawer responsiveness)
  useEffect(() => {
    if (onClose) {
      onClose();
    }
  }, [location.pathname]);

  if (!user) return null;

  const linkBaseStyle = "flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all duration-200 rounded-xl";
  const getLinkStyle = (isActive) => {
    return isActive
      ? `${linkBaseStyle} bg-indigo-50 text-indigo-700`
      : `${linkBaseStyle} text-slate-600 hover:bg-slate-50 hover:text-slate-900`;
  };

  const renderCandidateLinks = () => (
    <>
      <NavLink to="/candidate/dashboard" className={({ isActive }) => getLinkStyle(isActive)}>
        <LayoutDashboard size={18} className="shrink-0" />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/candidate/profile" className={({ isActive }) => getLinkStyle(isActive)}>
        <User size={18} className="shrink-0" />
        <span>My Profile</span>
      </NavLink>
      <NavLink to="/candidate/education" className={({ isActive }) => getLinkStyle(isActive)}>
        <GraduationCap size={18} className="shrink-0" />
        <span>Education</span>
      </NavLink>
      <NavLink to="/candidate/skills" className={({ isActive }) => getLinkStyle(isActive)}>
        <Code size={18} className="shrink-0" />
        <span>Skills</span>
      </NavLink>
      <NavLink to="/candidate/experience" className={({ isActive }) => getLinkStyle(isActive)}>
        <Briefcase size={18} className="shrink-0" />
        <span>Experience</span>
      </NavLink>
      <NavLink to="/candidate/documents" className={({ isActive }) => getLinkStyle(isActive)}>
        <FileText size={18} className="shrink-0" />
        <span>Resume & Portfolio</span>
      </NavLink>
      <NavLink to="/candidate/projects" className={({ isActive }) => getLinkStyle(isActive)}>
        <Award size={18} className="shrink-0" />
        <span>Projects</span>
      </NavLink>
      <NavLink to="/candidate/jobs" className={({ isActive }) => getLinkStyle(isActive)}>
        <Search size={18} className="shrink-0" />
        <span>Companies & Jobs</span>
      </NavLink>
      <NavLink to="/candidate/applications" className={({ isActive }) => getLinkStyle(isActive)}>
        <CheckSquare size={18} className="shrink-0" />
        <span>My Applications</span>
      </NavLink>
      <NavLink to="/candidate/interviews" className={({ isActive }) => getLinkStyle(isActive)}>
        <Calendar size={18} className="shrink-0" />
        <span>My Interviews</span>
      </NavLink>
    </>
  );

  const renderCompanyLinks = () => (
    <>
      <NavLink to="/company/dashboard" className={({ isActive }) => getLinkStyle(isActive)}>
        <LayoutDashboard size={18} className="shrink-0" />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/company/profile" className={({ isActive }) => getLinkStyle(isActive)}>
        <User size={18} className="shrink-0" />
        <span>Company Profile</span>
      </NavLink>
      <NavLink to="/company/verification" className={({ isActive }) => getLinkStyle(isActive)}>
        <FileCheck size={18} className="shrink-0" />
        <span>Verification</span>
      </NavLink>
      <NavLink to="/company/post-job" className={({ isActive }) => getLinkStyle(isActive)}>
        <PlusCircle size={18} className="shrink-0" />
        <span>Post Job</span>
      </NavLink>
      <NavLink to="/company/jobs" className={({ isActive }) => getLinkStyle(isActive)}>
        <Briefcase size={18} className="shrink-0" />
        <span>Manage Jobs</span>
      </NavLink>
      <NavLink to="/company/interviews" className={({ isActive }) => getLinkStyle(isActive)}>
        <Calendar size={18} className="shrink-0" />
        <span>Interviews</span>
      </NavLink>
    </>
  );

  const renderAdminLinks = () => (
    <>
      <NavLink to="/admin/dashboard" className={({ isActive }) => getLinkStyle(isActive)}>
        <LayoutDashboard size={18} className="shrink-0" />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/admin/company-verification" className={({ isActive }) => getLinkStyle(isActive)}>
        <FileCheck size={18} className="shrink-0" />
        <span>Company Verification</span>
      </NavLink>
      <NavLink to="/admin/insights" className={({ isActive }) => getLinkStyle(isActive)}>
        <BarChart3 size={18} className="shrink-0" />
        <span>Insights</span>
      </NavLink>
    </>
  );

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 top-16 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-300 animate-fade-in"
        ></div>
      )}

      <aside className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-slate-200 z-30 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto select-none ${isOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        <div className="p-4 py-6 flex flex-col gap-6">
          <div className="px-4">
            <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
              {user.role} workspace
            </span>
          </div>
          <nav className="flex flex-col gap-1.5">
            {user.role === "candidate" && renderCandidateLinks()}
            {user.role === "company" && renderCompanyLinks()}
            {user.role === "admin" && renderAdminLinks()}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
