
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthNav from "@/components/AuthNav";
import { useAuth } from "@/contexts/AuthContext";

const PatientSchedule = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/sign-in");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-health-600"></div>
      </div>
    );
  }

  // Return early if user is not authenticated
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Patient Schedule</h1>
          <p className="text-gray-600">
            This is the patient schedule page. Content will be coming soon.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PatientSchedule;
