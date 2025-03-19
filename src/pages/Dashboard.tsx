
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to user profile since dashboard is now integrated there
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/sign-in");
      } else {
        navigate("/user-profile");
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-health-600"></div>
      </div>
    );
  }

  return null; // No UI needed as we're redirecting
};

export default Dashboard;
