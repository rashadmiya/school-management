// pages/ExamsPage.jsx
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExamList from "@/components/exam/ExamList";
import UpcomingExams from "@/components/exam/UpcomingExams";
import TodaysExams from "@/components/exam/TodaysExams";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import { useGetTeacherExamsQuery } from "@/features/apis/examsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default function ExamsPage() {
  const [selectedClass, setSelectedClass] = useState(null);
  
  const { data: classesData } = useGetClassesQuery();
  const { data: subjectsData } = useGetSubjectsQuery();
  const { data: teacherExams } = useGetTeacherExamsQuery();
  // console.log("classesData at examPage:", classesData)

  const classes = classesData?.classes || classesData?.docs || [];
  const subjects = subjectsData?.subjects || subjectsData?.docs || [];
  const stats = teacherExams?.statistics;

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Exam Management</h1>
          <p className="text-gray-600 mt-2">
            Schedule, manage, and track academic examinations
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
              <p className="text-2xl font-bold text-green-600">{stats.upcoming}</p>
              <p className="text-sm text-gray-600">Upcoming</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.today}</p>
              <p className="text-sm text-gray-600">Today</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Exams</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ExamList 
                classes={classes}
                subjects={subjects}
                showFilters={true}
              />
            </TabsContent>

            <TabsContent value="upcoming">
              <ExamList 
                classes={classes}
                subjects={subjects}
                showFilters={false}
              />
            </TabsContent>

            <TabsContent value="today">
              <TodaysExams />
            </TabsContent>

            <TabsContent value="completed">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>Completed exams view coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <UpcomingExams />
          <TodaysExams />
          
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
                <span className="text-sm text-gray-600">Upcoming Exams</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {stats?.upcoming || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Exams Today</span>
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  {stats?.today || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}