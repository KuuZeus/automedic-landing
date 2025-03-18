
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock user data - would be fetched from API in a real app
const mockUserData = {
  id: "GH-DOC-10235",
  name: "Dr. Kwame Mensah",
  email: "kwame.mensah@kbth.gov.gh",
  phone: "+233 20 123 4567",
  hospital: "Korle Bu Teaching Hospital",
  clinic: "Diabetes Clinic",
  specialty: "Endocrinology",
  photoUrl: "",
};

const UserProfile = () => {
  const navigate = useNavigate();
  const user = mockUserData;

  return (
    <div className="container max-w-4xl mx-auto py-24 px-4">
      <Button 
        variant="ghost" 
        className="mb-6 flex items-center gap-2" 
        onClick={() => navigate("/patient-schedule")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Patient Schedule
      </Button>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.photoUrl} alt={user.name} />
              <AvatarFallback className="text-2xl">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-4 flex-1">
              <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground">{user.id}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hospital</p>
                  <p className="font-medium">{user.hospital}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clinic</p>
                  <p className="font-medium">{user.clinic}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Specialty</p>
                  <p className="font-medium">{user.specialty}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Account Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline">Change Password</Button>
              <Button variant="outline">Update Profile</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
