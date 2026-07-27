// components/exams/ExamList.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Plus, Search, Calendar, Clock, Filter, AlertTriangle } from "lucide-react";
import { useGetExamsQuery, useDeleteExamMutation } from "@/features/apis/examsApi";
import ExamForm from "./ExamForm";
import { format, isToday, isTomorrow, isAfter, isBefore } from "date-fns";
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";
import { toast } from "react-toastify";


export default function ExamList({ classes = [], subjects = [], showFilters = true }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, refetch } = useGetExamsQuery(filters);
  const [deleteExam] = useDeleteExamMutation();

  const exams = data?.exams || [];

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;
    try {
      await deleteExam(id).unwrap();
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete exam");
    }
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingExam(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingExam(null);
    refetch();
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const getExamStatus = (examDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDay = new Date(examDate);

    if (isToday(examDay)) {
      return { label: 'Today', color: 'bg-red-100 text-red-800', priority: 1 };
    } else if (isTomorrow(examDay)) {
      return { label: 'Tomorrow', color: 'bg-orange-100 text-orange-800', priority: 2 };
    } else if (isAfter(examDay, today)) {
      return { label: 'Upcoming', color: 'bg-green-100 text-green-800', priority: 3 };
    } else {
      return { label: 'Completed', color: 'bg-gray-100 text-gray-800', priority: 4 };
    }
  };

  const isExamSoon = (examDate) => {
    const now = new Date();
    const exam = new Date(examDate);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return isAfter(exam, now) && isBefore(exam, threeDaysFromNow);
  };

  // Filter exams by search query
  const filteredExams = exams.filter(exam =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.class?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.subject?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort exams by date and status priority
  const sortedExams = [...filteredExams].sort((a, b) => {
    const statusA = getExamStatus(a.date);
    const statusB = getExamStatus(b.date);

    if (statusA.priority !== statusB.priority) {
      return statusA.priority - statusB.priority;
    }

    return new Date(a.date) - new Date(b.date);
  });

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
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-2xl">Exam Schedule</CardTitle>
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Schedule Exam
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Filter by:</span>
              </div>

              <Select
                // onValueChange={(value) => updateFilter("class", value)}
                onValueChange={(value) => updateFilter("class", value === "all" ? undefined : value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem._id} value={classItem._id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
              // onValueChange={(value) => updateFilter("subject", value)}
              onValueChange={(value) => updateFilter("subject", value === "all" ? undefined : value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject._id} value={subject._id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
              // onValueChange={(value) => updateFilter("status", value)}
              onValueChange={(value) => updateFilter("status", value === "all" ? undefined : value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Exams Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {searchQuery || Object.values(filters).some(f => f) ? (
                      "No exams found matching your criteria."
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="w-12 h-12 text-gray-300" />
                        <p>No exams scheduled.</p>
                        <p className="text-sm">Schedule your first exam to get started.</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                sortedExams.map((exam) => {
                  const status = getExamStatus(exam.date);
                  const examSoon = isExamSoon(exam.date);

                  return (
                    <TableRow key={exam._id} className={examSoon ? 'bg-yellow-50' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className={examSoon ? 'font-semibold' : ''}>{exam.title}</span>
                          {examSoon && (
                            <AlertTriangle className="w-3 h-3 text-yellow-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {exam.class?.name}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{exam.subject?.name}</div>
                          <div className="text-sm text-gray-500">{exam.subject?.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span className="text-sm">
                              {format(new Date(exam.date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-sm font-mono">
                              {exam.startTime} - {exam.endTime}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {calculateDuration(exam.startTime, exam.endTime)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {exam.totalMarks} marks
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(exam)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(exam._id)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Exam Form Dialog */}
      <ExamForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        initialData={editingExam}
        classes={classes}
        subjects={subjects}
      />
    </div>
  );
}

// Helper function to calculate duration
function calculateDuration(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  const duration = endTotal - startTotal;

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  }
  return `${minutes}m`;
}