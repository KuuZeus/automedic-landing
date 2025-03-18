
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Platform = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-health-700 to-health-500 bg-clip-text text-transparent mb-2">
            SynchoraHealth Platform
          </h1>
          <p className="text-gray-600">
            Access your healthcare scheduling tools
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/sign-in" className="block w-full">
            <Button className="w-full py-6 bg-health-600 hover:bg-health-700">
              Sign In
            </Button>
          </Link>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Don't have an account?
              </span>
            </div>
          </div>
          
          <Link to="/sign-up" className="block w-full">
            <Button 
              variant="outline" 
              className="w-full py-6 border-health-200 text-health-700 hover:bg-health-50"
            >
              Create Account
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <Link to="/" className="text-health-600 hover:text-health-700 font-medium">
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Platform;
