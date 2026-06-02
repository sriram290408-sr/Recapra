import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../api/axiosInstance";
import { AlertCircle } from "lucide-react";

const CompanyLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [verification, setVerification] = useState({
    is_verified: false,
    verification_status: "pending",
    rejection_reason: null,
    loading: true
  });
  
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const fetchVerificationStatus = async () => {
    try {
      const response = await axiosInstance.get("/company/verification-status");
      setVerification({
        is_verified: response.data.is_verified,
        verification_status: response.data.verification_status,
        rejection_reason: response.data.rejection_reason,
        loading: false
      });
    } catch (err) {
      console.error("Failed to fetch verification status:", err);
      setVerification((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchVerificationStatus();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onMenuClick={toggleSidebar} />
      <div className="flex flex-1 pt-16">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className="flex-1 lg:pl-64 min-w-0 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Verification Warning Alert banner */}
            {!verification.loading && !verification.is_verified && (
              <div className={`p-4 border rounded-2xl flex gap-3.5 items-start shadow-xs animate-fade-in ${
                verification.verification_status === "rejected"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold">
                    {verification.verification_status === "rejected" 
                      ? "Company Verification Rejected" 
                      : "Account Pending Admin Verification"}
                  </h4>
                  <p className="text-xs font-semibold leading-relaxed opacity-95">
                    {verification.verification_status === "rejected"
                      ? `Your account verification was rejected. Reason: ${verification.rejection_reason || 'Incomplete details'}. Please upload valid documents in the Verification tab.`
                      : "Your company account is pending verification. You can complete your profile details, but you cannot post jobs until admin approval."}
                  </p>
                </div>
              </div>
            )}
            
            <Outlet context={{ isVerified: verification.is_verified, verificationStatus: verification.verification_status }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompanyLayout;
