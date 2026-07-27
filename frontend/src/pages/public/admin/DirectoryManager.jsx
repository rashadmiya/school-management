// components/admin/directory/DirectoryManager.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Users2, GraduationCap, BookOpen, Building, Plus, BarChart3, Filter } from "lucide-react";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useGetStudentsQuery } from "@/features/apis/studentsApi";
import { useGetTeachersQuery } from "@/features/apis/teachersApi";
import StuffManager from "@/components/admin/directory/StuffManager";
import CommitteeManager from "@/components/admin/directory/CommitteeManager";
import CabinetManager from "@/components/admin/directory/CabinetManager";
import ClubManager from "@/components/admin/directory/ClubManager";

export default function DirectoryManager() {
  const [activeTab, setActiveTab] = useState("stuff");
  
  // Fetch related data for statistics
  const { data: classesData } = useGetClassesQuery();
  const { data: studentsData } = useGetStudentsQuery();
  const { data: teachersData } = useGetTeachersQuery();

  const classes = classesData?.classes || [];
  const students = studentsData?.students || studentsData?.docs || [];
  const teachers = teachersData?.teachers || teachersData?.docs || [];

  // Calculate statistics
  const stats = {
    totalClasses: classes.length,
    totalStudents: students.length,
    totalTeachers: teachers.length,
    currentSession: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building className="w-6 h-6" />
                Directory Management
              </CardTitle>
              <CardDescription>
                Manage school staff, committees, student cabinet, and clubs
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                Session: {stats.currentSession}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold mt-1">{stats.totalStudents}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Teachers</p>
                    <p className="text-2xl font-bold mt-1">{stats.totalTeachers}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Classes</p>
                    <p className="text-2xl font-bold mt-1">{stats.totalClasses}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Session</p>
                    <p className="text-2xl font-bold mt-1">{stats.currentSession}</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Main Directory Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="stuff" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Staff</span>
          </TabsTrigger>
          <TabsTrigger value="committee" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">Committee</span>
          </TabsTrigger>
          <TabsTrigger value="cabinet" className="flex items-center gap-2">
            <Users2 className="w-4 h-4" />
            <span className="hidden sm:inline">Cabinet</span>
          </TabsTrigger>
          <TabsTrigger value="clubs" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Clubs</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stuff">
          <StuffManager />
        </TabsContent>

        <TabsContent value="committee">
          <CommitteeManager />
        </TabsContent>

        <TabsContent value="cabinet">
          <CabinetManager classes={classes} />
        </TabsContent>

        <TabsContent value="clubs">
          <ClubManager teachers={teachers} students={students} />
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Directory Overview</CardTitle>
              <CardDescription>
                Summary of all directory items across the school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                <p>Directory analytics and overview coming soon...</p>
                <p className="text-sm mt-2">
                  View statistics, reports, and analytics across all directory categories
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}