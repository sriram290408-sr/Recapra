import React, { createContext, useState, useEffect, useContext } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("recapra_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const response = await axiosInstance.get("/auth/me");
      setUser(response.data);
    } catch (err) {
      console.error("Failed to restore session:", err);
      localStorage.removeItem("recapra_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post("/auth/login", { email, password });
      const { access_token } = response.data;
      localStorage.setItem("recapra_token", access_token);
      
      // Fetch user profile immediately
      const meResponse = await axiosInstance.get("/auth/me");
      setUser(meResponse.data);
      setLoading(false);
      return meResponse.data;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.detail || "Login failed. Please check your credentials.";
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const register = async (name, email, password, role) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post("/auth/register", {
        name,
        email,
        password,
        role,
      });
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.detail || "Registration failed.";
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    localStorage.removeItem("recapra_token");
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
