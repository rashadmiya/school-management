// components/teacher/TeacherAttendance.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, BarChart3, Plus, ArrowLeft } from "lucide-react";
import { useGetTeacherClassesQuery } from "@/features/apis/teachersApi";

import { Link, useSearchParams } from "react-router-dom";
import AttendanceSummary from "@/components/attendance/AttendanceSummary";
import AttendanceMarker from "@/components/attendance/AttendanceMark";

export default function TeacherAttendance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("mark");
  const [selectedClassId, setSelectedClassId] = useState(searchParams.get("class") || "");

  const { data: classesData, isLoading } = useGetTeacherClassesQuery();
  const classes = classesData?.classes || [];

  // If class is selected via URL parameter, use it
  React.useEffect(() => {
    const urlClassId = searchParams.get("class");
    if (urlClassId && classes.some(cls => cls._id === urlClassId)) {
      setSelectedClassId(urlClassId);
    }
  }, [searchParams, classes]);

  const selectedClass = classes.find(cls => cls._id === selectedClassId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading your classes...</div>
        </CardContent>
      </Card>
    );
  }

  // If no class is selected, show class selection
  if (!selectedClassId && classes.length > 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-gray-600 mt-2">Mark and view attendance for your classes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{classes.length}</p>
                  <p className="text-sm text-gray-600">Total Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {classes.reduce((total, cls) => total + (cls.students?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Today</p>
                  <p className="text-sm text-gray-600">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Classes Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Select a Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem) => (
                <Card
                  key={classItem._id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedClassId(classItem._id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        {/* <h3 className="font-semibold text-lg">{classItem.name}</h3> */}
                        <h3 className="font-semibold text-lg">
                          {classItem.name} {classItem.section ? `- ${classItem.section.name}` : ''}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {classItem.students?.length || 0} students
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {classItem.subjects?.length || 0} subjects
                          </Badge>
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {classes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>No classes assigned to you yet.</p>
                <p className="text-sm">Contact administrator to get assigned to classes.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // If class is selected, show attendance management
  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedClassId("");
              setSearchParams({});
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classes
          </Button>
          <div>
            {/* <h1 className="text-3xl font-bold">Attendance - {selectedClass?.name}</h1> */}
            <h1 className="text-3xl font-bold">
              Attendance - {selectedClass?.name} {selectedClass?.section ? `- ${selectedClass.section.name}` : ''}
            </h1>
            <p className="text-gray-600 mt-2">
              Managing attendance for {selectedClass?.students?.length || 0} students
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            {selectedClass?.students?.length || 0} Students
          </Badge>
          <Badge variant="outline">
            {selectedClass?.subjects?.length || 0} Subjects
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mark" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Mark Attendance
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            View Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="space-y-6">
          <AttendanceMarker classId={selectedClassId} />
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <AttendanceSummary classId={selectedClassId} />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setActiveTab("mark")}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Mark Today's Attendance
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("summary")}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              View Monthly Report
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Student Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}