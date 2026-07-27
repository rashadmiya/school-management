// components/teacher/TeacherExams.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, BookOpen, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { useGetTeacherClassesQuery, useGetTeacherExamsQuery } from "@/features/apis/teachersApi";
import { format } from "date-fns";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import ExamForm from "@/components/exam/ExamForm";

export default function TeacherExams() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const [filter, setFilter] = useState("all"); // all, upcoming, completed
  const { data, isLoading, refetch } = useGetTeacherExamsQuery();

  const exams = data?.exams || [];

    // const { data: classesData } = useGetClassesQuery();
  const { data: classesData } = useGetTeacherClassesQuery();
  console.log("classes at the teacher exam :", classesData);
  const classes = classesData?.classes || [];

  const { data: subjectsData, isLoading: isSubjectsLoading } = useGetSubjectsQuery();
  const subjects = subjectsData?.subjects;

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingExam(null);
    refetch();
  };

  // Filter exams based on status
  const filteredExams = exams.filter(exam => {
    const today = new Date();
    const examDate = new Date(exam.date);

    if (filter === "upcoming") return examDate >= today;
    if (filter === "completed") return examDate < today;
    return true;
  });

  const stats = {
    total: exams.length,
    upcoming: exams.filter(e => new Date(e.date) >= new Date()).length,
    completed: exams.filter(e => new Date(e.date) < new Date()).length,
    today: exams.filter(e => {
      const examDate = new Date(e.date);
      return examDate.toDateString() === new Date().toDateString();
    }).length
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Exams</h1>
          <p className="text-gray-600 mt-2">Manage and schedule examinations</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Exam
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
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
                <p className="text-2xl font-bold">{stats.upcoming}</p>
                <p className="text-sm text-gray-600">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-sm text-gray-600">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={filter === "all" ? "default" : "ghost"}
          onClick={() => setFilter("all")}
        >
          All Exams
        </Button>
        <Button
          variant={filter === "upcoming" ? "default" : "ghost"}
          onClick={() => setFilter("upcoming")}
        >
          Upcoming
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "ghost"}
          onClick={() => setFilter("completed")}
        >
          Completed
        </Button>
      </div>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No exams found.</p>
              <p className="text-sm">Schedule your first exam to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Title</TableHead>
                  <TableHead>Class & Subject</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => {
                  const examDate = new Date(exam.date);
                  const today = new Date();
                  const isUpcoming = examDate >= today;
                  const isToday = examDate.toDateString() === today.toDateString();

                  return (
                    <TableRow key={exam._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-500" />
                          {exam.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{exam.class?.name}</div>
                          <Badge variant="outline" className="text-xs">
                            {exam.subject?.name}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            {format(examDate, "MMM dd, yyyy")}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            {exam.startTime} - {exam.endTime}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{exam.totalMarks} marks</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            isToday ? "default" : isUpcoming ? "outline" : "secondary"
                          }
                          className={
                            isToday
                              ? "bg-green-100 text-green-800"
                              : isUpcoming
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }
                        >
                          {isToday ? "Today" : isUpcoming ? "Upcoming" : "Completed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          {isUpcoming && (
                            <>
                              <Button variant="outline" size="sm"
                              onClick={()=>{
                                setEditingExam(exam);
                                setIsFormOpen(true)
                              }}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </>
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

      {/* Exam Form Dialog */}
      <ExamForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        initialData={editingExam}
        subjects={subjects}
        classes={classes}
      />
    </div>
  );
}