
import React from "react";
import { Link } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Platform = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto flex items-center justify-between px-4">
          {/* Back to homepage button removed */}
        </div>
      </header>
      
      <main className="flex-grow pt-12 pb-16">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-health-700 to-health-500 bg-clip-text text-transparent">
              Welcome to SynchoraHealth Platform
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Schedule appointments, manage patients, and streamline your healthcare practice.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-center">Account Access</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Create Account</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin">
                    <p className="text-gray-600 mb-4">
                      Already have an account? Sign in to access your dashboard, manage appointments and view patient records.
                    </p>
                    <Link to="/sign-in" className="w-full">
                      <Button className="w-full bg-health-600 hover:bg-health-700">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </Button>
                    </Link>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <p className="text-gray-600 mb-4">
                      New to SynchoraHealth? Create an account to start managing your healthcare practice efficiently.
                    </p>
                    <Link to="/sign-up" className="w-full">
                      <Button className="w-full bg-health-600 hover:bg-health-700">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Account
                      </Button>
                    </Link>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Platform;
