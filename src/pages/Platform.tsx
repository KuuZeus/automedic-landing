
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Platform = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-health-700 to-health-500 bg-clip-text text-transparent">
              Welcome to SynchoraHealth Platform
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Schedule appointments, manage patients, and streamline your healthcare practice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Already have an account? Sign in to access your dashboard, manage appointments and view patient records.
                </p>
              </CardContent>
              <CardFooter>
                <Link to="/sign-in" className="w-full">
                  <Button className="w-full bg-health-600 hover:bg-health-700">
                    Sign In <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  New to SynchoraHealth? Create an account to start managing your healthcare practice efficiently.
                </p>
              </CardContent>
              <CardFooter>
                <Link to="/sign-up" className="w-full">
                  <Button className="w-full bg-health-600 hover:bg-health-700">
                    Sign Up <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Platform;
