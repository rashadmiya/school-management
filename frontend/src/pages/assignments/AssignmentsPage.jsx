// pages/AssignmentsPage.jsx
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AssignmentList from "@/components/assignment/AssignmentList";
import UpcomingAssignments from "@/components/assignment/UpcomingAssignments";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import { useGetTeacherAssignmentsQuery } from "@/features/apis/assignmentsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AssignmentsPage() {
  const [selectedClass, setSelectedClass] = useState(null);
  
  const { data: classesData } = useGetClassesQuery();
  const { data: subjectsData } = useGetSubjectsQuery();
  const { data: teacherAssignments } = useGetTeacherAssignmentsQuery();

  const classes = classesData?.classes || classesData?.docs || [];
  const subjects = subjectsData?.subjects || subjectsData?.docs || [];
  const stats = teacherAssignments?.statistics;

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);

  return (
    <div className="container space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assignment Management</h1>
          <p className="text-gray-600 mt-2">
            Create, manage, and track academic assignments
          </p>
        </div>
        
        {/* Teacher Stats */}
        {stats && (
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-sm text-gray-600">Overdue</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
        {/* Main Content */}
        <div className="lg:col-span-4">
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Assignments</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
              <TabsTrigger value="my">My Assignments</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <AssignmentList 
                classes={classes}
                subjects={subjects}
                showFilters={true}
              />
            </TabsContent>

            <TabsContent value="active">
              <AssignmentList 
                classes={classes}
                subjects={subjects}
                showFilters={false}
              />
            </TabsContent>

            <TabsContent value="overdue">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>Overdue assignments view coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="my">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>My assignments view coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <UpcomingAssignments />
          
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Classes</span>
                <Badge variant="outline">{classes.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Subjects</span>
                <Badge variant="outline">{subjects.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Assignments</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {stats?.active || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}