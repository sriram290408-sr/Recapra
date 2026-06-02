import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 animate-fade-in">
      <Navbar />
      <main className="flex-1 pt-16 flex flex-col">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs font-bold text-slate-500 select-none">
        <p>&copy; {new Date().getFullYear()} Recapra. Rebuilding Careers, Restoring Confidence.</p>
      </footer>
    </div>
  );
};

export default PublicLayout;
