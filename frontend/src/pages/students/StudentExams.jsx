// components/student/StudentExams.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, BookOpen, AlertCircle, CheckCircle } from "lucide-react";
import { useGetStudentExamsQuery } from "@/features/apis/studentsApi";
import { format, isAfter, isBefore, isToday } from "date-fns";

export default function StudentExams() {
  const [filter, setFilter] = useState("upcoming");
  const { data, isLoading } = useGetStudentExamsQuery();
  
  const exams = data?.exams || [];

  // Categorize exams
  const now = new Date();
  const categorizedExams = {
    upcoming: exams.filter(exam => isAfter(new Date(exam.date), now)),
    completed: exams.filter(exam => isBefore(new Date(exam.date), now)),
    today: exams.filter(exam => isToday(new Date(exam.date))),
    all: exams
  };

  const currentExams = categorizedExams[filter] || [];

  const getExamStatus = (exam) => {
    const examDate = new Date(exam.date);
    
    if (isToday(examDate)) {
      return { label: "Today", variant: "default", color: "bg-green-100 text-green-800" };
    }
    
    if (isAfter(examDate, now)) {
      const daysUntil = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
      return { 
        label: `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`, 
        variant: "outline",
        color: "bg-blue-100 text-blue-800"
      };
    }
    
    return { label: "Completed", variant: "secondary", color: "bg-gray-100 text-gray-800" };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading exams...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Exams</h1>
        <p className="text-gray-600 mt-2">View your exam schedule and preparation status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{exams.length}</p>
                <p className="text-sm text-gray-600">Total Exams</p>
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
                <p className="text-2xl font-bold">{categorizedExams.upcoming.length}</p>
                <p className="text-sm text-gray-600">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categorizedExams.completed.length}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categorizedExams.today.length}</p>
                <p className="text-sm text-gray-600">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Exams</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {currentExams.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">No exams found</p>
                  <p className="text-sm">
                    {filter === 'today' 
                      ? "No exams scheduled for today" 
                      : filter === 'upcoming'
                      ? "No upcoming exams"
                      : "No completed exams"
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Total Marks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentExams.map((exam) => {
                      const status = getExamStatus(exam);
                      const examDate = new Date(exam.date);
                      
                      return (
                        <TableRow key={exam._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{exam.title}</p>
                              <p className="text-sm text-gray-500">
                                {exam.class?.name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {exam.subject?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>{format(examDate, 'MMM dd, yyyy')}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>{exam.startTime} - {exam.endTime}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {calculateDuration(exam.startTime, exam.endTime)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {exam.totalMarks} marks
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className={status.color}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                              {isAfter(examDate, now) && (
                                <Button size="sm">
                                  Study Plan
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Today's Exams Alert */}
      {categorizedExams.today.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">
                  You have {categorizedExams.today.length} exam(s) today
                </p>
                <p className="text-sm text-orange-700">
                  Good luck! Make sure you have all necessary materials ready.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exam Preparation Tips */}
      {categorizedExams.upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Exam Preparation Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">Study Strategies</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Create a study schedule</li>
                  <li>• Practice with past papers</li>
                  <li>• Take regular breaks</li>
                  <li>• Review key concepts</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Exam Day</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Get adequate sleep</li>
                  <li>• Eat a healthy breakfast</li>
                  <li>• Arrive early</li>
                  <li>• Read instructions carefully</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to calculate exam duration
function calculateDuration(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  const durationMinutes = endTotal - startTotal;
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  }
  return `${minutes}m`;
}