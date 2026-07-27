// components/teacher/TeacherAssignments.jsx
import AssignmentForm from "@/components/assignment/AssignmentForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeleteAssignmentMutation, useGetTeacherAssignmentsQuery } from "@/features/apis/assignmentsApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import { useGetTeacherClassesQuery } from "@/features/apis/teachersApi";
import { format, isAfter, isBefore } from "date-fns";
import { BookOpen, Calendar, Edit, Eye, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function TeacherAssignments() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignments, setEditingAssignments] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const { data, isLoading, refetch } = useGetTeacherAssignmentsQuery();
  const { data: classesData } = useGetTeacherClassesQuery();
  const classes = classesData?.classes || [];

  const { data: subjectsData, isLoading: isSubjectsLoading } = useGetSubjectsQuery();
  const subjects = subjectsData?.subjects;

  // console.log("classes :", classes)
  const [deleteAssignment] = useDeleteAssignmentMutation();

  const assignments = data?.assignments || [];

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAssignments(null);
    refetch();
  };
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await deleteAssignment(id).unwrap();
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete assignment");
    }
  };

  const getAssignmentStatus = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);

    if (isAfter(due, now)) {
      return { status: 'active', color: 'bg-green-100 text-green-800', label: 'Active' };
    } else {
      return { status: 'overdue', color: 'bg-red-100 text-red-800', label: 'Overdue' };
    }
  };

  const isDueSoon = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return isAfter(due, now) && isBefore(due, threeDaysFromNow);
  };

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    if (statusFilter === "all") return true;
    const status = getAssignmentStatus(assignment.dueDate);
    return status.status === statusFilter;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading your assignments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Assignments</h1>
          <p className="text-gray-600 mt-2">Create and manage assignments for your classes</p>
        </div>
        <Button onClick={()=> setIsFormOpen(true)}>
          {/* <Link to="/teacher/assignments/new"> */}
            <Plus className="w-4 h-4 mr-2" />
            New Assignment
          {/* </Link> */}
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
                <p className="text-2xl font-bold">{assignments.length}</p>
                <p className="text-sm text-gray-600">Total</p>
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
                <p className="text-2xl font-bold">
                  {assignments.filter(a => getAssignmentStatus(a.dueDate).status === 'active').length}
                </p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {assignments.filter(a => getAssignmentStatus(a.dueDate).status === 'overdue').length}
                </p>
                <p className="text-sm text-gray-600">Overdue</p>
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
                <p className="text-2xl font-bold">
                  {assignments.filter(a => isDueSoon(a.dueDate)).length}
                </p>
                <p className="text-sm text-gray-600">Due Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Your Assignments</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignments</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No assignments found.</p>
              <p className="text-sm">Create your first assignment to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment Title</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => {
                  const status = getAssignmentStatus(assignment.dueDate);
                  const dueSoon = isDueSoon(assignment.dueDate);

                  return (
                    <TableRow key={assignment._id} className={dueSoon ? 'bg-yellow-50' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span className={dueSoon ? 'font-semibold' : ''}>{assignment.title}</span>
                        </div>
                        {assignment.description && (
                          <p className="text-sm text-gray-600 truncate max-w-xs">
                            {assignment.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {assignment.class?.name}
                      </TableCell>
                      <TableCell>
                        {assignment.subject?.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className={dueSoon ? 'font-medium text-yellow-700' : ''}>
                            {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                          </span>
                          {dueSoon && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs">
                              Soon
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/teacher/assignments/${assignment._id}`}>
                              <Eye className="w-3 h-3" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/teacher/assignments/${assignment._id}/edit`}>
                              <Edit className="w-3 h-3" />
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(assignment._id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
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

      {/* Assignments Form Dialog */}
      <AssignmentForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        initialData={editingAssignments}
        subjects={subjects}
        classes={classes}
      />
    </div>
  );
}