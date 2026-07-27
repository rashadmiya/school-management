// components/teacher/TeacherDashboard.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, BookOpen, Clock, BarChart3, Bell } from "lucide-react";
import { useGetTeacherClassesQuery } from "@/features/apis/teachersApi";
import { useGetTodayRoutineQuery, useGetTodaySchedulesQuery } from "@/features/apis/routineApi";
import { useGetUpcomingAssignmentsQuery } from "@/features/apis/assignmentsApi";
import { useGetTodayExamsQuery } from "@/features/apis/examsApi";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export default function TeacherDashboard() {
  const { data: classesData } = useGetTeacherClassesQuery();
  // const { data: todayRoutine } = useGetTodayRoutineQuery();
  const { data: todayRoutine } = useGetTodaySchedulesQuery();
  const { data: assignmentsData } = useGetUpcomingAssignmentsQuery();
  const { data: examsData } = useGetTodayExamsQuery();

  const classes = classesData?.classes || [];
  const todayClasses = todayRoutine?.routines || [];
  const upcomingAssignments = assignmentsData?.assignments?.slice(0, 3) || [];
  const todayExams = examsData?.exams || [];

  const stats = {
    totalClasses: classes.length,
    todayClasses: todayClasses.length,
    pendingAssignments: upcomingAssignments.length,
    todayExams: todayExams.length
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's your overview for today.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/teacher/attendance">Mark Attendance</Link>
              </Button>
              <Button asChild>
                <Link to="/teacher/assignments/new">Create Assignment</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalClasses}</p>
                <p className="text-sm text-gray-600">Total Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.todayClasses}</p>
                <p className="text-sm text-gray-600">Today's Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingAssignments}</p>
                <p className="text-sm text-gray-600">Pending Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.todayExams}</p>
                <p className="text-sm text-gray-600">Today's Exams</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayClasses.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No classes scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((routine) => (
                  <div
                    key={routine._id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{routine.class?.name}</p>
                      <p className="text-sm text-gray-600">{routine.subject?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{routine.startTime} - {routine.endTime}</p>
                      {routine.roomNumber && (
                        <Badge variant="outline" className="text-xs">
                          {routine.roomNumber}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-3 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/teacher/routines">View Full Schedule</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Upcoming Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No upcoming assignments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm truncate">{assignment.title}</p>
                      <p className="text-xs text-gray-600">
                        {assignment.class?.name} • Due {format(new Date(assignment.dueDate), 'MMM dd')}
                      </p>
                    </div>
                    <Badge variant={
                      new Date(assignment.dueDate) < new Date() ? "destructive" : "outline"
                    }>
                      {format(new Date(assignment.dueDate), 'MMM dd')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-3 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/teacher/assignments">View All Assignments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex flex-col" asChild>
              <Link to="/teacher/attendance">
                <Users className="w-5 h-5 mb-1" />
                <span className="text-sm">Mark Attendance</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-16 flex flex-col" asChild>
              <Link to="/teacher/assignments/new">
                <BookOpen className="w-5 h-5 mb-1" />
                <span className="text-sm">Create Assignment</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-16 flex flex-col" asChild>
              <Link to="/teacher/exams/new">
                <Calendar className="w-5 h-5 mb-1" />
                <span className="text-sm">Schedule Exam</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-16 flex flex-col" asChild>
              <Link to="/teacher/results">
                <BarChart3 className="w-5 h-5 mb-1" />
                <span className="text-sm">Enter Results</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}